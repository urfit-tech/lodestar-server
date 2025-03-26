import ZabbixSender from 'node-zabbix-sender';

class ZabbixHeartBeater extends ZabbixSender {
  constructor(opts?: ZabbixSenderOptions) {
    super(opts);
    this.host = process.env?.ZABBIX_SERVER_HOST || '';
    this.port = Number(process.env?.ZABBIX_SERVER_PORT);
  }
  beat() {
    console.log(this.host, this.port, process.env?.ZABBIX_ITEM_KEY)
    if (this.host !== '' && !Number.isNaN(this.port) && process.env?.ZABBIX_ITEM_KEY) {
      this.addItem(process.env.ZABBIX_HOST || '', process.env.ZABBIX_ITEM_KEY, 'OK');
      this.send((err, res) => {
        if (err) console.error(err);
      });
    }
  }
}

export default ZabbixHeartBeater;
