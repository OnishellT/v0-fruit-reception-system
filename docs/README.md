# Documentation

This directory contains all technical documentation for the Fruit Reception System.

---

## 📁 Available Documents

### 1. [On-Screen Keypad Implementation](ON-SCREEN-KEYPAD.md)
**Purpose:** Mobile-optimized numeric keypad for touch devices

**Covers:**
- Keypad component architecture
- Mobile vs Desktop layout modes
- Touch-friendly button design
- Integration with form fields
- Testing procedures

**Key Features:**
- Persistent bottom keypad bar
- Numeric and decimal keypad types
- Immediate layout updates
- Clean, minimal design

---

### 2. [Layout Update Fix](LAYOUT-UPDATE-FIX.md)
**Purpose:** Immediate layout mode switching without page refresh

**Covers:**
- Root cause analysis
- Hook enhancements (useUserPreferences)
- Component re-rendering strategy
- State synchronization across components

**Key Features:**
- No manual refresh needed
- Instant desktop ↔ mobile switching
- Auto-cleanup of active states
- Storage event listeners

---

### 3. [Database Setup Guide](DATABASE-SETUP.md)
**Purpose:** Complete guide for database initialization and troubleshooting

**Covers:**
- Common errors and solutions
- Database seeding procedures
- Table creation scripts
- Troubleshooting steps

**Key Features:**
- Clear error messages
- Step-by-step setup instructions
- Seed data examples
- Reset procedures

---

## 🚀 Quick Start

### For Mobile Keypad Issues:
👉 See [On-Screen Keypad Implementation](ON-SCREEN-KEYPAD.md)

### For Layout Switching Issues:
👉 See [Layout Update Fix](LAYOUT-UPDATE-FIX.md)

### For Database/Setup Issues:
👉 See [Database Setup Guide](DATABASE-SETUP.md)

---

## 📋 Table of Contents

1. [On-Screen Keypad](#1-onscreen-keypad-implementation)
2. [Layout Update Fix](#2-layout-update-fix)
3. [Database Setup](#3-database-setup-guide)

---

## 🔧 Technical Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **UI Components:** Radix UI + Tailwind CSS
- **Keypad:** Custom React component
- **State Management:** React hooks + localStorage

---

## 📝 File Structure

```
docs/
├── README.md                    # This file
├── ON-SCREEN-KEYPAD.md         # Keypad documentation
├── LAYOUT-UPDATE-FIX.md        # Layout switching fix
└── DATABASE-SETUP.md           # Database setup guide
```

---

## 🎯 Common Issues & Solutions

| Issue | Document | Section |
|-------|----------|---------|
| Keypad not appearing | [On-Screen Keypad](ON-SCREEN-KEYPAD.md) | Testing |
| Layout not updating | [Layout Update Fix](LAYOUT-UPDATE-FIX.md) | Testing |
| Reception creation errors | [Database Setup](DATABASE-SETUP.md) | Error Messages |
| Missing data in dropdowns | [Database Setup](DATABASE-SETUP.md) | Quick Fix |

---

## 💡 Tips

1. **Always check console logs** (F12) for detailed error messages
2. **Use the provided seed data** for quick setup
3. **Test on mobile devices** for keypad functionality
4. **Switch layouts multiple times** to verify updates

---

## 📞 Support

For additional help:
1. Check the relevant document in this folder
2. Review console logs
3. Verify database setup
4. Test with seed data

---

*Last updated: October 2025*
