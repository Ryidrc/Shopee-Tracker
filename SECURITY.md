# API Key Security Guide

## ✅ Your API Key is Already Protected!

Good news! Your `.env.local` file is already in `.gitignore` (line 13: `*.local`), which means it will **never be committed to Git**.

## 🔒 Security Checklist

Before pushing to GitHub, verify these protections are in place:

### 1. Check `.gitignore` includes `.env.local`

```bash
# This should show "*.local" in the file
cat .gitignore | grep "*.local"
```

### 2. Verify `.env.local` is not tracked

```bash
# This should NOT show .env.local
git status
```

### 3. Check Git history (if you accidentally committed it before)

```bash
# Search for any API keys in commit history
git log --all --full-history -- .env.local
```

If you find `.env.local` in history, you need to remove it:

```bash
# Remove from history (DANGEROUS - creates new commits)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if necessary)
git push origin --force --all
```

## 📝 Best Practices

### ✅ DO:

- ✅ Keep API keys in `.env.local` (already gitignored)
- ✅ Use `.env.example` with placeholder values (safe to commit)
- ✅ Document setup steps in README
- ✅ Use environment variables in code (`process.env.GROQ_API_KEY`)
- ✅ Rotate API keys if accidentally exposed

### ❌ DON'T:

- ❌ Hard-code API keys in source files
- ❌ Commit `.env.local` to Git
- ❌ Share API keys in screenshots or documentation
- ❌ Use the same API key across multiple projects

## 🚨 If You Accidentally Exposed Your API Key

1. **Immediately revoke the key** at https://console.groq.com
2. **Generate a new API key**
3. **Update your `.env.local`** with the new key
4. **Remove from Git history** (see commands above)
5. **Force push** to overwrite GitHub history

## 🔐 Alternative: Use localStorage (Client-side only)

For client-side apps, users can set their own API key:

```javascript
// In browser console
localStorage.setItem("groq_api_key", "your_api_key_here");
```

This way, each user uses their own API key, and you don't need to expose yours.

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Groq API Key Management](https://console.groq.com)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)
