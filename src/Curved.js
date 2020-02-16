import React from "react";
import { Chart, Geom, Axis, Tooltip, Legend } from "bizcharts";
import _ from "underscore";
import { getTransactions } from "./euler";

const balance_of_time = (unspends, spents) => {
  spents = spents.map(x => {
    x.type = "spent";
    x.t = timestampToTime(x.t);
    return x;
  });

  unspends = unspends.map(x => {
    x.type = "unspend";
    x.t = timestampToTime(x.t);
    return x;
  });

  let actions = spents.concat(unspends);
  let actions_of_time = _.sortBy(_.groupBy(actions, a => a.t), arr => arr[0].t);
  // console.log(actions_of_time, "actions_of_time");

  let balance_of_time = _.reduce(
    actions_of_time,
    (args, actions) => {
      const cur_unspends = args.us;
      const map = args.map;
      // console.log(actions, 'k')
      let t = actions[0].t;
      // console.log(v)

      // add unspends
      let new_unspends = _.filter(actions, x => x.type === "unspend");
      const cur_unspends1 = cur_unspends.concat(new_unspends);

      // console.log(cur_unspends, 'cur_unspends')

      // sub spents
      const cur_spents = _.filter(actions, x => x.type === "spent");
      // console.log(cur_spents, "cur_spents");
      const cur_unspends2 = cur_spents.reduce((us, s) => {
        return _.reject(us, u => u.txid === s.txid && u.index === s.index);
      }, cur_unspends1);
      // console.log(cur_unspends2, "unspents2");
      let cur_balance = _.reduce(cur_unspends2, (b, u) => (b += u.v), 0);
      // console.log(cur_balance, 'balance');
      return {
        us: cur_unspends2,
        map: map.set(t, cur_balance)
      };
    },
    {
      us: [],
      map: new Map()
    }
  ).map;

  let result = [];
  balance_of_time.forEach((v, k) => {
    result.push({
      date: k,
      balance: v / 100000000
    });
  });
  return result;
};

function timestampToTime(timestamp) {
  var date = new Date(timestamp * 1000); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
  // console.log(date);
  var Y = date.getFullYear() + "-";
  var M =
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) + "-";
  var D = date.getDate() < 10 ? "0" + date.getDate() + " " : date.getDate();
  //     var h = date.getHours() < 10 ? '0'+date.getHours()+ ':' : date.getHours()+ ':';
  //     var m = date.getMinutes() < 10 ? '0'+date.getMinutes()+ ':' : date.getMinutes()+ ':';
  //     var s = date.getSeconds()< 10 ? '0'+date.getSeconds() : date.getSeconds();
  return Y + M + D;
}

class Curved extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,
      addr: null,
      tip: "Accounting ledger..."
    };
  }

  componentDidMount() {
    this.renderData();
  }

  async renderData() {
    let addr = this.props.address;
    if (addr === "") {
      addr = "1344kyFGPUWYJokpoSsH7geWHDAjt2xQUu";
    }
    // console.log(addr, "curve got addr");
    this.setState({
      addr: addr
    });
    let unspends = getTransactions(addr, "unspend");
    let spents = getTransactions(addr, "spent");
    unspends = await unspends;
    spents = await spents;
    // console.log(unspends, "unspends");
    // console.log(spents, "spents");

    let data = balance_of_time(unspends, spents);
    // console.log(data);
    this.setState({
      data: data,
      tip: ""
    });
  }

  render() {
    const scale = {
      date: {
        type: "timeCat"
      }
    };
    return (
      <div>
        <h3>{this.state.addr}</h3>
        <h3>{this.state.tip}</h3>
        <Chart height={400} data={this.state.data} scale={scale} forceFit>
          <Legend />
          <Axis
            name="date"
            label={{
              formatter: val => `${val}  `
            }}
          />
          <Axis
            name="balance"
            label={{
              formatter: val => `${val} BSV`
            }}
          />
          <Geom type="line" position="date*balance" size={2} shape={"smooth"} />
          <Geom
            type="point"
            position="date*balance"
            size={4}
            shape={"circle"}
            style={{
              stroke: "#fff",
              lineWidth: 1
            }}
          />
          <Tooltip
          // showTitle={false}
          />
        </Chart>
      </div>
    );
  }
}

export default Curved;
