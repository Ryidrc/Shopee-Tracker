# PocketBase Setup Guide for Sales Tracker

## Quick Start

### 1. Download PocketBase

1. Visit https://pocketbase.io/docs/
2. Download PocketBase for Windows
3. Extract `pocketbase.exe` to: `c:\Users\Ry\Personal\All Programs\Sales Tracker\pocketbase\`

### 2. Start PocketBase

1. Run `start-pocketbase.bat` in the Sales Tracker folder
2. PocketBase will start on `http://localhost:3001`
3. **First time only**: Open `http://   localhost:3001/_/` and create an admin account

### 3. Create Collection

1. In PocketBase Admin (`http://localhost:3001/_/`), go to **Collections** → **New Collection**
2. Name: `sales_tracker_data`
3. Type: **Base Collection**
4. Add the following fields:

| Field Name      | Type     | Required | Options                            |
| --------------- | -------- | -------- | ---------------------------------- |
| user            | Relation | ✓        | Collection: `users`, Max select: 1 |
| salesData       | JSON     |          |                                    |
| pricingItems    | JSON     |          |                                    |
| videoLogs       | JSON     |          |                                    |
| tasks           | JSON     |          |                                    |
| taskCompletions | JSON     |          |                                    |
| workLogs        | JSON     |          |                                    |
| competitors     | JSON     |          |                                    |
| products        | JSON     |          |                                    |
| goals           | JSON     |          |                                    |
| windowStates    | JSON     |          |                                    |
| lastUpdated     | Date     |          |                                    |

### 4. Configure API Rules

In the `sales_tracker_data` collection, set these API rules:

**List/Search Rule:**

```
@request.auth.id != ""
```

**View Rule:**

```
@request.auth.id != ""
```

**Create Rule:**

```
@request.auth.id != ""
```

**Update Rule:**

```
@request.auth.id = user.id
```

**Delete Rule:**

```
@request.auth.id = user.id
```

---

## Using PocketBase in Sales Tracker

### First Time Login

1. Start both PocketBase (`start-pocketbase.bat`) and Sales Tracker (`npm run dev`)
2. In Sales Tracker, click the **cloud icon** in the header
3. Click **"Don't have an account? Sign up"**
4. Enter your email and password (minimum 8 characters)
5. Click **Create Account**

### Daily Use

**Starting Servers (Easy Way):**

1. Double-click `start-all.bat` - This starts both servers automatically!
2. Open `http://localhost:3000` in your browser

**Starting Servers (Manual Way):**

1. Run `start-pocketbase.bat` (keep this window open)
2. Run `npm run dev` in Sales Tracker folder
3. Open `http://localhost:3000` in your browser

**Auto-Start on Windows Boot:**

1. Run `create-startup-shortcut.bat` once
2. Sales Tracker will automatically start when Windows boots
3. To disable: Press Win+R, type `shell:startup`, delete the shortcut

**Syncing Data:**

- Click the **cloud icon** in the header to manually sync
- Icon turns **green** when logged in
- Shows spinning animation while syncing
- Hover to see sync status and logged-in email

**Multi-Device Access:**

- Access from any device on your network: `http://YOUR_PC_IP:3000`
- Login with the same account on each device
- Data syncs across all devices

---

## Features

✅ **Manual Sync** - Click cloud button to sync data  
✅ **Cross-Device** - Access from any device on your network  
✅ **Local Storage** - Data persists in browser even when offline  
✅ **Secure** - Data stored on your local PocketBase server  
✅ **Window States** - Window positions and sizes sync across devices

---

## Troubleshooting

### "Not authenticated" errors

- Make sure you're logged in (click cloud icon)
- Check that PocketBase is running on port 3001
- Try logging out and back in

### Data not syncing

- Check browser console for errors (F12)
- Verify the collection was created correctly
- Ensure API rules are set properly
- Make sure both servers are running

### Can't create account

- Make sure PocketBase server is running
- Check that the `users` collection exists (created by default)
- Verify email format is correct
- Password must be at least 8 characters

### Port conflicts

- **PocketBase**: 3001
- **Sales Tracker**: 3000
- If ports are in use, stop other applications or change ports in config

---

## Admin Panel

Access PocketBase admin at `http://localhost:3001/_/` to:

- View all synced data
- Manage users
- Check sync status
- Backup database
- View logs

---

## Data Structure

Each user has one record in `sales_tracker_data` containing:

- **salesData**: All sales records
- **pricingItems**: Product pricing database
- **videoLogs**: Video tracking logs
- **tasks**: Task definitions
- **taskCompletions**: Completed tasks
- **workLogs**: Work time logs
- **competitors**: Competitor tracking data
- **products**: Product definitions
- **goals**: Sales goals
- **windowStates**: Window positions and sizes

All data is stored as JSON and syncs as a complete snapshot.

---

## Notes

- PocketBase runs locally on your computer
- No internet connection required
- Data is not sent to any external servers
- Accessible only on your local network
- Free and open source
