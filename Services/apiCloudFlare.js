const axios = require("axios");
const Logger = require('../Logger/Logger');
const {config} = require('../Config/config')

const CF_TOKEN = config.cloudflareApi.cf_token 
const ACCOUNT_ID = config.cloudflareApi.account_id
const ZONE_ID= config.cloudflareApi.zone_id


class CloudflareApi {

  static async getFirewallEventsByIP(){
    const now = new Date();
    const yesterday = new Date(now.getTime() - 60 * 60 * 1000);

    const datetime_gt = yesterday.toISOString();
    const datetime_lt = now.toISOString();

    const query = `
      query ($zoneTag: String!, $datetime_gt: Time!, $datetime_lt: Time!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            zoneTag
            firewallEventsAdaptive(
              filter: { datetime_gt: $datetime_gt, datetime_lt: $datetime_lt }
              limit: 1000
              orderBy: [datetime_DESC]
            ) {
              datetime
              clientIP
              action
              ruleId
              source
              userAgent
            }
          }
        }
      }
    `;

    const variables = { zoneTag: ZONE_ID, datetime_gt, datetime_lt };

    try {
      const res = await axios.post(
        "https://api.cloudflare.com/client/v4/graphql",
        { query, variables },
        {
          headers: {
            Authorization: `Bearer ${CF_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      const events = res.data.data.viewer.zones?.[0]?.firewallEventsAdaptive || [];

      if (!events.length) {
        console.log("ℹ️ No hay eventos de firewall en las últimas 24 horas.");
        return;
      }

      // Filtrar solo bloqueos / 403
      const blockedEvents = events.filter(e => e.action === "block" || e.action === "jschallenge");

      // Agrupar por IP
      const ipMap = {};
      blockedEvents.forEach(e => {
        if (!ipMap[e.clientIP]) {
          ipMap[e.clientIP] = { ip: e.clientIP, count: 0, actions: new Set() };
        }
        ipMap[e.clientIP].count++;
        ipMap[e.clientIP].actions.add(e.action);
      });

      // Convertir a array y mostrar
      const result = Object.values(ipMap)
        .sort((a, b) => b.count - a.count)
        .map(r => ({ ip: r.ip, count: r.count, actions: Array.from(r.actions).join("|") }));

      //console.table(result);
      return result;
    } catch (err) {
      console.error("❌ Error al consultar GraphQL:", err.response?.data || err.message);
      return false
    }

  };

  static async getAllIPLists() {
  try {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rules/lists`,
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const lists = res.data.result;

    if (!lists.length) {
      console.log("⚠️ No tienes listas de IP creadas en tu cuenta Cloudflare.");
      return;
    }

    console.log(`📋 Listas de IP personalizadas encontradas (${lists.length}):\n`);

    lists.forEach((list, i) => {
      console.log(`${i + 1}. ${list.name}`);
      console.log(`   ID: ${list.id}`);
      console.log(`   Tipo: ${list.kind}`);
      console.log(`   Cantidad de items: ${list.num_items}`);
      console.log(`   Descripción: ${list.description || "(sin descripción)"}\n`);
    });
  } catch (error) {
    console.error(
      "❌ Error al consultar listas:",
      error.response?.data || error.message
    );
  }
  };

  static async addIPToList(list, ipToBlackList) {
  try {
    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rules/lists/${list}/items`,
      ipToBlackList, // Array: puedes agregar varios items al mismo tiempo
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.data.success) {
      Logger.log(`Las ip se agregaron correctamente con comentario:`);
      console.table(ipToBlackList);
    } else {
      Logger.log('❌ Error al agregar IP:', res.data.errors);
    }
  } catch (err) {
    Logger.error('❌ Error al llamar la API:', err.response?.data || err.message);
  }
  };

  static async listItems(LIST_ID) {
  try {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rules/lists/${LIST_ID}/items`,
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.data.success) {
      Logger.log('❌ Error:', res.data.errors);
      return;
    }

    const items = res.data.result;
    let listIp = items.map(item => ({
      id : item.id,
      ip : item.ip,
      created_on : item.comment
    }));
    return listIp;
    //console.table(listIp)

  } catch (err) {
    Logger.error('❌ Error al consultar la lista:', err.response?.data || err.message);
  }
  };

  static async deleteIPToList(item_id) {
  try {
    const res = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rules/lists/${LIST_ID}/items`,
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          items: [{ id: item_id }]
        }
      }
    );

    if (res.data.success) {
      console.log(`✅ Item ${item_id} eliminado correctamente`);
    } else {
      console.log('❌ Error al eliminar:', res.data.errors);
    }

  } catch (err) {
    console.error('❌ Error al llamar la API:', err.response?.data || err.message);
  }
  };

}


module.exports = {CloudflareApi}
