/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
async function userInfo(id) {
  if (!id) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(`/api/users/info/${id}`, {
    method: "get",
  });

  return await req.json();
}

async function blacklistUser(id) {
  if (!id) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(`/api/users/blacklist/${id}`, {
    method: "post",
  });

  return await req.json();
}
async function blacklistUser_email(email) {
  if (!email) return { error: "You forgot to provide an email" }; // temp err

  const req = await fetch(`/api/users/blacklist/email/${email}`, {
    method: "post",
  });

  return await req.json();
}

async function unblacklistUser(id) {
  if (!id) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(`/api/users/unblacklist/${id}`, {
    method: "post",
  });

  return await req.json();
}
async function unblacklistUser_email(email) {
  if (!email) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(`/api/users/unblacklist/email/${email}`, {
    method: "post",
  });

  return await req.json();
}

async function setCoins(id, coins, add_coins) {
  if (!id) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(
    `/api/users/${add_coins ? "add" : "set"}_coins/${id}`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        coins: Number(coins),
      }),
    }
  );

  return await req.json();
}
async function setCoins_email(email, coins, add_coins) {
  if (!email) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(
    `/api/users/${add_coins ? "add" : "set"}_coins/email/${email}`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        coins: Number(coins),
      }),
    }
  );

  return await req.json();
}

async function setPackage(id, pkg) {
  if (!id) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(`/api/resources/set_package/${id}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      package: pkg,
    }),
  });

  return await req.json();
}
async function setPackage_email(email, pkg) {
  if (!email) return { error: "You have not provided a user ID." }; // temp err

  const req = await fetch(`/api/resources/set_package/email/${email}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      package: pkg,
    }),
  });

  return await req.json();
}

async function setResources(id, memory, disk, cpu, servers, add_resources) {
  if (!id) return { error: "You have not provided a user ID." };

  const req = await fetch(
    `/api/resources/${add_resources ? "add" : "set"}_resources/${id}`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        memory: Number(memory),
        disk: Number(disk),
        cpu: Number(cpu),
        servers: Number(servers),
      }),
    }
  );

  return await req.json();
}
async function setResources_email(
  email,
  memory,
  disk,
  cpu,
  servers,
  add_resources
) {
  if (!email) return { error: "You have not provided a user ID." };

  const req = await fetch(
    `/api/resources/${add_resources ? "add" : "set"}_resources/email/${email}`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        memory: Number(memory),
        disk: Number(disk),
        cpu: Number(cpu),
        servers: Number(servers),
      }),
    }
  );

  return await req.json();
}

async function createCoupon(code, coins, memory, disk, cpu, servers, uses) {
  const req = await fetch("/api/coupons/create_coupon", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      coupon: String(code),
      coins: Number(coins),
      memory: Number(memory),
      disk: Number(disk),
      cpu: Number(cpu),
      servers: Number(servers),
      uses: Number(uses),
    }),
  });

  return await req.json();
}

async function revokeCoupon(code) {
  if (!code) return { error: "You have not provided a coupon code." };

  const req = await fetch(`/api/coupons/revoke_coupon/${code}`, {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return await req.json();
}
async function updateName(id, name) {
  if (!id) return { error: "You have not provided a id." };
  if (!name) return { error: "You forgot to provide a name" };

  const req = await fetch(`/api/name/change`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: String(id),
      name: String(name),
    }),
  });

  return await req.json();
}

async function createJ4R(
  j4r_id,
  server_id,
  days,
  memory,
  disk,
  cpu,
  servers,
  invite
) {
  const req = await fetch("/api/j4r/create", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      j4r_id: String(j4r_id),
      server_id: String(server_id),
      days: Number(days),
      memory: Number(memory),
      disk: Number(disk),
      cpu: Number(cpu),
      servers: Number(servers),
      invite: String(invite),
    }),
  });

  return await req.json();
}
async function deleteJ4R(j4r_id) {
  const req = await fetch("/api/j4r/delete", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      j4r_id: String(j4r_id),
    }),
  });

  return await req.json();
}

async function asyncAlert(func) {
  // temp func
  Swal.fire(JSON.stringify(await func));
}
async function asyncFunc(func) {
  await func;
}
/*async function blacklistById() {
  const { value: id } = await Swal.fire({
    title: "Blacklisting by discord Id",
    input: "text",
    inputLabel: "Discord ID",
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "You need to write something!";
      }
    },
  });

  if (id) {
    blacklistUser(id);
    return Swal.fire(
      "Discord blacklisting by ID",
      `Successfully blacklisted the user by ID: ${id}`,
      "success"
    );
  }
}*/
async function updateSmtp(server, port, user, password) {
  const req = await fetch("/api/smtp/update", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      server: String(server),
      user: String(user),
      port: Number(port),
      password: String(password),
    }),
  });

  return await req.json();
}
async function userinfo_email(email) {
  if (!email) return { error: "You forgot to provide an email." }; // temp err

  const req = await fetch(`/api/users/info/email/${email}`, {
    method: "get",
  });

  return await req.json();
}
$(".js-modal-rel-trigger").click(function () {
  var modalId = $(this).attr("data-target");
  $(modalId).modal();

  $(".modal-backdrop")
    .addClass("modal-rel-backdrop")
    .appendTo($(modalId).parent());
  $("body").removeClass("modal-open");
});
