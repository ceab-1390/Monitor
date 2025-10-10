const axios = require("axios");

const CF_TOKEN = "5JC1z97oonYR3FauY93J_DM-l2d5hBnjjgQ55CCq"; // ⚠️ tu token
const ACCOUNT_ID = "e22413105a81f8dbe54f377815246592";
const ZONE_ID="e79c00fc155dcf4e6cda3508f3863cc9"

async function getAllIPLists() {
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
}

//getAllIPLists();

const LIST_ID = '54fd599a9fca414c8dc8f8cb4afd05c7'; // lista "administradores"

async function addIP(ip, comment) {
  try {
    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rules/lists/${LIST_ID}/items`,
      [
        { ip, comment } // ⚡ Array: puedes agregar varios items al mismo tiempo
      ],
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.data.success) {
      console.log(`✅ IP ${ip} agregada correctamente con comentario: "${comment}"`);
    } else {
      console.log('❌ Error al agregar IP:', res.data.errors);
    }

  } catch (err) {
    console.error('❌ Error al llamar la API:', err.response?.data || err.message);
  }
};



// Ejemplo de uso:
//addIP('203.0.113.25', 'Servidor de pruebas');



async function listItems() {
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
      console.log('❌ Error:', res.data.errors);
      return;
    }

    const items = res.data.result;
    console.log(`📋 Items en la lista (${items.length}):\n`);
    items.forEach((item, i) => {
      console.log(`${i+1}. IP: ${item.ip}`);
      console.log(`   Item ID: ${item.id}`);
      console.log(`   Comment: ${item.comment || '(sin descripción)'}`);
      console.log('---');
    });

  } catch (err) {
    console.error('❌ Error al consultar la lista:', err.response?.data || err.message);
  }
}

listItems();



async function deleteIP(item_id) {
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
}

//deleteIP('4bb59c55766b468da2625ad7f86b91aa')