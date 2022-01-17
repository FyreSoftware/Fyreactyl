/* eslint-disable camelcase */
const fetch = require("node-fetch");
const mysql = require("mysql2");
const pool = mysql.createPool({
  host: process.env.database.host,
  port: process.env.database.port,
  user: process.env.database.user,
  password: process.env.database.password,
  database: process.env.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// If you were smart, you would complete redo the coin system by using something that could higher the coin limit, while being able to handle big numbers. (since Javascript sucks at handling big numbers)

pool.query(
  `
    CREATE TABLE IF NOT EXISTS \`accounts\` (
      \`email\` varchar(255) PRIMARY KEY,
      \`password\` varchar(255) DEFAULT NULL,
      \`discord_id\` varchar(255) DEFAULT NULL,
      \`pterodactyl_id\` varchar(255) DEFAULT NULL,
      \`blacklisted\` varchar(255) DEFAULT NULL,
      \`coins\` int(11) DEFAULT NULL,
      \`package\` varchar(255) DEFAULT NULL,
      \`memory\` int(11) DEFAULT NULL,
      \`disk\` int(11) DEFAULT NULL,
      \`cpu\` int(11) DEFAULT NULL,
      \`servers\` int(11) DEFAULT NULL,
      \`name\` varchar(255) DEFAULT NULL,
      \`reset_id\` varchar(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `
);

pool.query(
  `
    CREATE TABLE IF NOT EXISTS \`renewal_timer\` (
      \`server_id\` varchar(255) PRIMARY KEY,
      \`date\` varchar(255) DEFAULT NULL,
      \`action\` varchar(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `
);

pool.query(
  `
    CREATE TABLE IF NOT EXISTS \`settings\` (
      \`id\` varchar(255) PRIMARY KEY,
      \`name\` varchar(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `
);

pool.query(
  `
    CREATE TABLE IF NOT EXISTS \`coupons\` (
      \`code\` varchar(255) PRIMARY KEY,
      \`coins\` int(11) DEFAULT NULL,
      \`memory\` int(11) DEFAULT NULL,
      \`disk\` int(11) DEFAULT NULL,
      \`cpu\` int(11) DEFAULT NULL,
      \`servers\` int(11) DEFAULT NULL,
      \`uses\` int(11) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `
);

pool.query(
  // This is for the list/information of J4Rs.
  `
    CREATE TABLE IF NOT EXISTS \`all_j4rs\` (
      \`j4r_id\` varchar(255) PRIMARY KEY,
      \`server_id\` varchar(255) DEFAULT NULL,
      \`expires_on\` varchar(255) DEFAULT NULL,
      \`memory\` int(11) DEFAULT NULL,
      \`disk\` int(11) DEFAULT NULL,
      \`cpu\` int(11) DEFAULT NULL,
      \`servers\` int(11) DEFAULT NULL,
      \`invite\` varchar(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `
);

pool.query(
  // This is for the resources users get from J4Rs.
  `
    CREATE TABLE IF NOT EXISTS \`user_j4rs\` (
      \`j4r_id\` varchar(255) DEFAULT NULL,
      \`discord_id\` varchar(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `
);
async function createSettings(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      "INSERT INTO settings (id, name) VALUES (?, ?)",
      [id, "Dashactyl"],

      function (error, results, fields) {
        if (error) return reject(error);

        resolve(results);
      }
    );
  });
}
module.exports = {
  async findOrCreateSettings(id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM settings WHERE id = ?",
        [id],
        async function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) return resolve(await createSettings(id));

          const settings = results[0];

          resolve(settings);
        }
      );
    });
  },
  async updatePassword(email, password) {
    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET password = ? WHERE email = ?",
        [password, email],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },
  async updateResetId(email, newID) {
    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET reset_id = ? WHERE email = ?",
        [newID, email],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },
  async updateName(id, name) {
    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE settings SET name = ? WHERE id = ?",
        [name, id],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },
  async createAccountOnDB(
    email,
    pterodactyl_id,
    discord_id = null,
    name = null,
    password = null
  ) {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO accounts (email, discord_id, pterodactyl_id, blacklisted, coins, package, memory, disk, cpu, servers, name, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          email,
          discord_id,
          pterodactyl_id,
          "false",
          0,
          null,
          0,
          0,
          0,
          0,
          name,
          password,
        ],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },

  async createOrFindAccount(
    username,
    email,
    first_name,
    last_name,
    discord_id = null,
    password = null
  ) {
    const generated_password =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const account = await fetch(
      `${process.env.pterodactyl.domain}/api/application/users`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.pterodactyl.key}`,
        },
        body: JSON.stringify({
          username: username,
          email: email,
          first_name: first_name,
          last_name: last_name,
          password: password ? password : generated_password,
        }),
      }
    );

    if ((await account.status) === 201) {
      // Successfully created account.
      const accountinfo = await account.json();

      await this.createAccountOnDB(
        email,
        accountinfo.attributes.id,
        discord_id,
        username,
        password
      );

      accountinfo.attributes.password = generated_password;

      accountinfo.attributes.relationships = {
        servers: { object: "list", data: [] },
      };

      return accountinfo.attributes;
    } else {
      // Find account.
      const accountlistjson = await fetch(
        `${
          process.env.pterodactyl.domain
        }/api/application/users?include=servers&filter[email]=${encodeURIComponent(
          email
        )}`,
        {
          method: "get",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.pterodactyl.key}`,
          },
        }
      );

      const accountlist = await accountlistjson.json();
      const user = accountlist.data.filter(
        (acc) => acc.attributes.email === email
      );

      if (user.length === 1) {
        const userid = user[0].attributes.id;
        await this.createAccountOnDB(
          email,
          userid,
          discord_id,
          username,
          password
        );

        return user[0].attributes;
      }

      return false;
    }
  },

  async fetchAccountPterodactylID(pterodactyl_id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM accounts WHERE pterodactyl_id = ?",
        [pterodactyl_id],
        function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) return resolve(null);

          const userInfo = results[0];

          resolve(userInfo);
        }
      );
    });
  },

  async fetchAccountDiscordID(discord_id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM accounts WHERE discord_id = ?",
        [discord_id],
        function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) return resolve(null);

          const userInfo = results[0];

          resolve(userInfo);
        }
      );
    });
  },
  async fetchAccountByEmail(email) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM accounts WHERE email = ?",
        [email],
        function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) return resolve(null);

          const userInfo = results[0];

          resolve(userInfo);
        }
      );
    });
  },
  async fetchAccountByEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM accounts WHERE email = ? AND password = ?",
        [email, password],
        function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) return resolve(null);

          const userInfo = results[0];

          resolve(userInfo);
        }
      );
    });
  },
  async getCoinsByEmail(email) {
    const dbinfo = await this.fetchAccountByEmail(email);
    if (!dbinfo) return null;

    return dbinfo.coins || 0;
  },
  async getCoinsByDiscordID(discord_id) {
    const dbinfo = await this.fetchAccountDiscordID(discord_id);
    if (!dbinfo) return null;

    return dbinfo.coins || 0;
  },
  async addCoinsByEmail(email, amount) {
    const dbinfo = await this.fetchAccountByEmail(email);
    if (!dbinfo) return null;

    let coins = dbinfo.coins || 0;
    coins += amount;

    coins = Math.round(coins);

    if (coins < 0) coins = 0;
    if (coins > 2147483647) coins = 2147483647;

    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET coins = ? WHERE accounts.email = ?",
        [coins, email],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(coins);
        }
      );
    });
  },
  async addCoinsByDiscordID(discord_id, amount) {
    const dbinfo = await this.fetchAccountDiscordID(discord_id);
    if (!dbinfo) return null;

    let coins = dbinfo.coins || 0;
    coins += amount;

    coins = Math.round(coins);

    if (coins < 0) coins = 0;
    if (coins > 2147483647) coins = 2147483647;

    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET coins = ? WHERE accounts.discord_id = ?",
        [coins, discord_id],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(coins);
        }
      );
    });
  },

  async setCoinsByEmail(email, amount) {
    const dbinfo = await this.fetchAccountByEmail(email);
    if (!dbinfo) return null;

    let coins = Math.round(amount);

    if (coins < 0) coins = 0;
    if (coins > 2147483647) coins = 2147483647;

    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET coins = ? WHERE email = ?",
        [coins, email],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(Math.round(coins));
        }
      );
    });
  },

  async setCoinsByDiscordID(discord_id, amount) {
    const dbinfo = await this.fetchAccountDiscordID(discord_id);
    if (!dbinfo) return null;

    let coins = Math.round(amount);

    if (coins < 0) coins = 0;
    if (coins > 2147483647) coins = 2147483647;

    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET coins = ? WHERE discord_id = ?",
        [coins, discord_id],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(Math.round(coins));
        }
      );
    });
  },

  async setPackageByEmail(email, pkg) {
    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET package = ? WHERE email = ?",
        [pkg, email],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(pkg);
        }
      );
    });
  },

  async setPackageByDiscordID(discord_id, pkg) {
    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET package = ? WHERE discord_id = ?",
        [pkg, discord_id],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(pkg);
        }
      );
    });
  },

  async setResourcesByEmail(email, memory, disk, cpu, servers) {
    const additions = [];
    const the_array = []; // Contains variables for "?" in MySQL.

    // Beautiful code that hurts my eyes, and I'm lazy af. - Two

    if (typeof memory === "number") {
      additions.push("memory = ?");
      the_array.push(memory);

      if (memory > 1073741823) memory = 1073741823;
    }

    if (typeof disk === "number") {
      additions.push("disk = ?");
      the_array.push(disk);

      if (disk > 1073741823) disk = 1073741823;
    }

    if (typeof cpu === "number") {
      additions.push("cpu = ?");
      the_array.push(cpu);

      if (cpu > 1073741823) cpu = 1073741823;
    }

    if (typeof servers === "number") {
      additions.push("servers = ?");
      the_array.push(servers);

      if (servers > 1073741823) servers = 1073741823;
    }

    the_array.push(email);

    return new Promise((resolve, reject) => {
      pool.query(
        `UPDATE accounts SET ${additions.join(", ")} WHERE email = ?`,
        the_array,

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },

  async setResourcesByDiscordID(discord_id, memory, disk, cpu, servers) {
    const additions = [];
    const the_array = []; // Contains variables for "?" in MySQL.

    // Beautiful code that hurts my eyes, and I'm lazy af. - Two

    if (typeof memory === "number") {
      additions.push("memory = ?");
      the_array.push(memory);

      if (memory > 1073741823) memory = 1073741823;
    }

    if (typeof disk === "number") {
      additions.push("disk = ?");
      the_array.push(disk);

      if (disk > 1073741823) disk = 1073741823;
    }

    if (typeof cpu === "number") {
      additions.push("cpu = ?");
      the_array.push(cpu);

      if (cpu > 1073741823) cpu = 1073741823;
    }

    if (typeof servers === "number") {
      additions.push("servers = ?");
      the_array.push(servers);

      if (servers > 1073741823) servers = 1073741823;
    }

    the_array.push(discord_id);

    return new Promise((resolve, reject) => {
      pool.query(
        `UPDATE accounts SET ${additions.join(", ")} WHERE discord_id = ?`,
        the_array,

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },

  async getAllRenewalTimers() {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM renewal_timer",
        function (error, results, fields) {
          if (error) return reject(error);

          resolve(results);
        }
      );
    });
  },

  async getSingleRenewalDate(server_id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM renewal_timer WHERE server_id = ?",
        [server_id],
        function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) {
            return resolve({
              action: "???",
              timer: "???",
            });
          }

          resolve({
            action: results[0].action,
            timer: parseFloat(results[0].date),
          });
        }
      );
    });
  },

  async runDBTimerActions(server_id, date, action = "suspend") {
    await this.removeRenewTimerFromDB(server_id);
    await this.addRenewTimerToDB(server_id, date, action);
    return true;
  },

  async addRenewTimerToDB(server_id, date, action) {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO renewal_timer (server_id, date, action) VALUES (?, ?, ?)",
        [server_id, date, action],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },

  async removeRenewTimerFromDB(server_id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "DELETE FROM renewal_timer WHERE server_id=?",
        [server_id],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },

  async createCoupon(code, coins, memory, disk, cpu, servers, uses) {
    const check_if_coupon_exists = await this.getCouponInfo(code);

    if (!check_if_coupon_exists) {
      return new Promise((resolve, reject) => {
        pool.query(
          "INSERT INTO coupons (code, coins, memory, disk, cpu, servers, uses) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [code, coins, memory, disk, cpu, servers, uses],

          function (error, results, fields) {
            if (error) return reject(error);

            resolve(true);
          }
        );
      });
    } else {
      return new Promise((resolve, reject) => {
        pool.query(
          "UPDATE coupons SET coins = ?, memory = ?, disk = ?, cpu = ?, servers = ? WHERE code = ? WHERE uses = ?",
          [coins, memory, disk, cpu, servers, code, uses],

          function (error, results, fields) {
            if (error) return reject(error);

            resolve(true);
          }
        );
      });
    }
  },

  async claimCoupon(code) {
    const check_if_coupon_exists = await this.getCouponInfo(code);

    if (check_if_coupon_exists.uses === 1) {
      return new Promise((resolve, reject) => {
        pool.query(
          "DELETE FROM coupons WHERE code = ?",
          [code],

          async (error, results, fields) => {
            if (error) return reject(error);

            resolve(check_if_coupon_exists);
          }
        );
      });
    } else if (check_if_coupon_exists.uses > 1) {
      await this.createCoupon(
        code,
        check_if_coupon_exists.coins,
        check_if_coupon_exists.memory,
        check_if_coupon_exists.disk,
        check_if_coupon_exists.cpu,
        check_if_coupon_exists.servers,
        check_if_coupon_exists.uses - 1
      );
      return check_if_coupon_exists;
    } else {
      return null;
    }
  },

  async getCouponInfo(code) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM coupons WHERE code = ?",
        [code],
        function (error, results, fields) {
          if (error) return reject(error);

          if (results.length !== 1) resolve(null);
          resolve(results[0]);
        }
      );
    });
  },

  async deleteCoupon(code) {
    const check_if_coupon_exists = await this.getCouponInfo(code);

    if (!check_if_coupon_exists) return null;

    return new Promise((resolve, reject) => {
      pool.query(
        "DELETE FROM coupons WHERE code = ?",
        [code],

        async (error, results, fields) => {
          if (error) return reject(error);

          resolve(check_if_coupon_exists);
        }
      );
    });
  },

  async checkJ4R(discord_id, user_guilds) {
    const userinfo = await process.db.fetchAccountDiscordID(discord_id);
    if (!userinfo) console.error("[CHECK J4R] Could not find user with ID.");

    const j4r_list = await this.allJ4Rs();

    const supposed_to_be_in = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM user_j4rs WHERE discord_id = ?",
        [discord_id],
        function (error, results, fields) {
          if (error) return reject(error);

          resolve(results);
        }
      );
    });

    for (const {
      j4r_id,
      server_id,
      expires_on,
      memory,
      disk,
      cpu,
      servers,
    } of j4r_list) {
      if (user_guilds.filter((s) => s.id === server_id).length === 1) {
        // In J4R server.
        if (expires_on > Date.now()) {
          // If the J4R didn't expire.
          if (
            supposed_to_be_in.filter((s) => s.j4r_id === j4r_id).length !== 1
          ) {
            // If it didn't give resources already, give resources.
            userinfo.memory += memory;
            userinfo.disk += disk;
            userinfo.cpu += cpu;
            userinfo.servers += servers;

            await new Promise((resolve, reject) => {
              pool.query(
                "INSERT INTO user_j4rs (j4r_id, discord_id) VALUES (?, ?)",
                [j4r_id, discord_id],

                function (error, results, fields) {
                  if (error) return reject(error);

                  resolve(true);
                }
              );
            });
          }
        }
      } else {
        // Not in J4R server.
        if (supposed_to_be_in.filter((s) => s.j4r_id === j4r_id).length === 1) {
          // If user left the server, remove resources.
          userinfo.memory -= memory;
          userinfo.disk -= disk;
          userinfo.cpu -= cpu;
          userinfo.servers -= servers;

          await new Promise((resolve, reject) => {
            pool.query(
              "DELETE FROM user_j4rs WHERE j4r_id = ? AND discord_id = ?",
              [j4r_id, discord_id],

              async (error, results, fields) => {
                if (error) return reject(error);

                resolve(true);
              }
            );
          });
        }
      }
    }

    await this.setResourcesByDiscordID(
      discord_id,
      userinfo.memory,
      userinfo.disk,
      userinfo.cpu,
      userinfo.servers
    );
  },

  async allJ4Rs() {
    return new Promise((resolve, reject) => {
      pool.query("SELECT * FROM all_j4rs", function (error, results, fields) {
        if (error) return reject(error);
        results.map((r) => {
          const date = new Date(r.expires_on);
          return {
            j4r_id: r.j4r_id,
            server_id: r.server_id,
            expires_on: date.toLocaleDateString("en-GB"),
            memory: r.memory,
            disk: r.disk,
            cpu: r.cpu,
            servers: r.servers,
            invite: r.invite,
          };
        });
        resolve(results);
      });
    });
  },

  async checkIfJ4RWithNameExists(id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM all_j4rs WHERE j4r_id = ?",
        [id],
        function (error, results, fields) {
          if (error) return reject(error);

          resolve(results.length !== 0);
        }
      );
    });
  },

  async createJ4R(
    j4r_id,
    server_id,
    expires_on,
    memory,
    disk,
    cpu,
    servers,
    invite
  ) {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO all_j4rs (j4r_id, server_id, expires_on, memory, disk, cpu, servers, invite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [j4r_id, server_id, expires_on, memory, disk, cpu, servers, invite],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },
  async deleteJ4R(j4r_id) {
    const check_if_coupon_exists = await this.checkIfJ4RWithNameExists(j4r_id);

    if (check_if_coupon_exists) {
      return new Promise((resolve, reject) => {
        pool.query(
          "DELETE FROM all_j4rs WHERE j4r_id = ?",
          [j4r_id],

          async (error, results, fields) => {
            if (error) return reject(error);

            resolve(check_if_coupon_exists);
          }
        );
      });
    } else {
      return null;
    }
  },
  async blacklistStatusByEmail(email) {
    return (await this.fetchAccountByEmail(email)).blacklisted;
  },
  async blacklistStatusByDiscordID(discord_id) {
    return (await this.fetchAccountDiscordID(discord_id)).blacklisted;
  },
  async toggleBlacklistByEmail(email, specific) {
    const new_status = specific || !(await this.blacklistStatusByEmail(email));

    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET blacklisted = ? WHERE email = ?",
        [
          new_status.toString(), // Is .toString() required? Too lazy to check.
          email,
        ],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(new_status);
        }
      );
    });
  },
  async toggleBlacklistByDiscordID(discord_id, specific) {
    const new_status =
      specific || !(await this.blacklistStatusByDiscordID(discord_id));

    return new Promise((resolve, reject) => {
      pool.query(
        "UPDATE accounts SET blacklisted = ? WHERE discord_id = ?",
        [
          new_status.toString(), // Is .toString() required? Too lazy to check.
          discord_id,
        ],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(new_status);
        }
      );
    });
  },
};
