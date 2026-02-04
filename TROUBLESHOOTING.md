# Troubleshooting Guide

## Data Disappeared / Not Syncing?

You might have noticed that data saved on **localhost:3001** does not appear on **localhost:3000**.

### Why is this happening?

For security reasons, your browser treats every port (3000, 3001, etc.) as a completely separate website. Data stored in "Local Storage" on Port 3001 **cannot** be accessed by Port 3000.

### How to Fix

If you have data on Port 3001 that you want to move to Port 3000:

1. **Open the App on the "Good" Port**  
   Go to [http://localhost:3001](http://localhost:3001) (or wherever your data currently is).

2. **Export Backup**
   - Click the **Export Backup** button (Arrow pointing down icon) in the top navigation bar.
   - Or press `Ctrl + S`.
   - This will save a `.json` file to your computer.

3. **Open the App on the Target Port**  
   Go to [http://localhost:3000](http://localhost:3000).

4. **Import Backup**
   - Click the **Import Backup** button (Arrow pointing up icon) in the top navigation bar.
   - Select the `.json` file you just downloaded.
   - Confirm the restore.

### Prevention

We have updated the configuration to use **Strict Port 3000**.
Now, if Port 3000 is occupied (e.g., by another hidden window), the app will **fail to start** rather than silently switching to 3001. This ensures you always know which "storage bin" you are using.

If you see an error saying "Port 3000 is already in use":

1. Check if you have another terminal or browser tab running the app.
2. Close it.
3. Run `npm run dev` again.
