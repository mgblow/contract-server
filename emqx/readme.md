## 🧩 EMQX Local Authentication + ACL Setup Guide

### 📦 1. Enable Password-Based Authentication

By default, EMQX 5 enables `password_based:built_in_database`.
To confirm, check the plugin list in your config or dashboard:

**Go to Dashboard:**
[http://localhost:18083](http://localhost:18083) → **Authentication** → ensure you see
`password_based:built_in_database` is **Enabled**

If not, enable it:

```bash
emqx ctl authn enable password_based:built_in_database
```

---

### 🔐 2. Get Your API Key and Secret

From the EMQX Dashboard → **Access Control → API Keys → Create Key**

Or via CLI:

```bash
emqx ctl admins add <username> <password>
```

Use those credentials (e.g. `api_key:api_secret`) for REST API calls.

---

### 🧱 3. Add a User via API

```bash
curl -u "<api_key>:<api_secret>" \
  -X POST http://localhost:18083/api/v5/authentication/password_based:built_in_database/users \
  -H "Content-Type: application/json" \
  -d '{
        "user_id": "client123",
        "password": "secret123",
        "is_superuser": false
      }'
```

✅ **Response Example:**

```json
{"data":{"user_id":"client123"},"code":0}
```

---

### 🌐 4. Set Up ACL Rules

Edit your EMQX ACL file (usually `/etc/emqx/acl.conf` or in Dashboard → Authorization → File)

Replace contents with:

```erlang
%% Allow admin user full access
{allow, {username, {re, "^admin.*$"}}, all, ["#"]}.

%% Allow each user to only publish/subscribe to their own topic tree
{allow, {username, {re, "^(.*)$"}}, all, ["${username}/#"]}.

%% Deny access to system topics
{deny, all, subscribe, ["$SYS/#"]}.

%% Default deny all other actions
{deny, all}.
```

> 🧠 `${username}` is automatically replaced by the user’s `user_id` at runtime.

Then restart EMQX:

```bash
sudo systemctl restart emqx
```

---

### 📡 5. Example: Subscribe & Publish

If your user is `client123`, they can only access:

```
client123/notifications
client123/updates/#
client123/anything
```

But cannot access:

```
client999/*
admin/*
```

---

### 🧰 6. Testing the Connection with MQTTX (or CLI)

```bash
mqttx pub -h localhost -p 1883 -u client123 -P secret123 -t "client123/updates" -m "hello world!"
```

or subscribe:

```bash
mqttx sub -h localhost -p 1883 -u client123 -P secret123 -t "client123/#"
```

✅ You’ll see the message only for that user’s namespace.

---

### 🧑‍💻 7. Optional: Create Admin User

```bash
curl -u "<api_key>:<api_secret>" \
  -X POST http://localhost:18083/api/v5/authentication/password_based:built_in_database/users \
  -H "Content-Type: application/json" \
  -d '{
        "user_id": "adminMaster",
        "password": "superSecret!",
        "is_superuser": true
      }'
```

This user can subscribe/publish **to any topic** (e.g. `/notifications/#`, `/users/#`, etc.)

---

### 🚀 8. Quick Summary

| Step | Action                | Command/Config                                                            |
| ---- | --------------------- | ------------------------------------------------------------------------- |
| 1    | Enable authentication | `emqx ctl authn enable password_based:built_in_database`                  |
| 2    | Create API key        | via dashboard                                                             |
| 3    | Add user              | curl POST `/api/v5/authentication/password_based:built_in_database/users` |
| 4    | Add ACL rules         | `/etc/emqx/acl.conf`                                                      |
| 5    | Restart EMQX          | `systemctl restart emqx`                                                  |
| 6    | Test connection       | MQTTX or `mosquitto_sub` / `pub`                                          |
| 7    | Create admin          | same API, `"is_superuser": true`                                          |

---