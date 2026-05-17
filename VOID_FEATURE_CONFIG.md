# Void Sale Feature - Configuration Guide

## ⚙️ Password Configuration

The default void password is set to: **`admin123`**

### How to Change the Password:

1. Open `src/pages/SalesHistory.jsx`
2. Find the line in `handlePasswordConfirm` function (around line 141):
   ```javascript
   const VOID_PASSWORD = 'admin123'
   ```
3. Replace `'admin123'` with your desired password

### Security Best Practices:

**For Production Environment:**

1. **Use Environment Variable:**
   - Add to your `.env` file:
     ```
     VITE_VOID_PASSWORD=your_secure_password
     ```
   - Update SalesHistory.jsx:
     ```javascript
     const VOID_PASSWORD = import.meta.env.VITE_VOID_PASSWORD
     ```

2. **Use Firebase Admin SDK (Recommended):**
   - Verify password through a backend service
   - This prevents exposing the password in client-side code
   - Add a backend API endpoint for password verification

3. **Add Role-Based Access:**
   - Only allow specific admin users to void sales
   - Check user role before showing void button
   - Log void actions with user identification

## 🔄 What Happens When You Void a Sale:

1. ✅ Sale record is deleted from the database
2. ✅ Stock is automatically restored for all items sold:
   - Medicines (simple, syrup, or tablets)
   - Store items (regular or food items with sacks)
3. ✅ Action is logged in stockEditHistory for audit trail
4. ✅ User sees success confirmation
5. ✅ Sales history list is automatically refreshed

## 📋 Void Button Location:

- Located in the Sales History page
- One "Void" button per sale record
- Red button with trash icon
- Appears in the "Actions" column

## 🔐 Password Modal:

- Shows when user clicks Void button
- Requires exact password match
- Shows error message if password is incorrect
- Can retry multiple times

## ✏️ Stock Restoration Details:

The system handles complex stock calculations:
- **Syrup medicines**: Restores bottleCount and looseMl separately
- **Tablet medicines**: Restores boxCount and looseTablets separately
- **Regular medicines**: Restores total stockQuantity
- **Food items**: Restores sacksCount and looseKg separately
- **Other store items**: Restores stockQuantity

## 📊 Audit Trail:

All void actions are logged in `stockEditHistory` collection with:
- Sale ID
- Sale type (consultation/store)
- Item name and quantity
- Void reason
- Timestamp

## ⚠️ Important Notes:

1. **No Undo**: Once voided, only manual re-entry can restore the sale
2. **Stock Accuracy**: Ensure inventory is correct before voiding
3. **Password Security**: Change the default password immediately in production
4. **User Logging**: Consider adding user ID to void logs for accountability

## 🆘 Troubleshooting:

**"Invalid password" error:**
- Check that password is exactly correct (case-sensitive)
- Default password is `admin123`

**Stock not restoring:**
- Check stockEditHistory for errors
- Verify the sale item IDs match the database records
- Check browser console for detailed error messages

**Button not appearing:**
- User may not have necessary permissions (if role-based access is implemented)
- Page may need to be refreshed

## 📝 Future Enhancements:

Consider implementing:
1. Two-factor verification for void actions
2. Manager approval workflow for voids
3. Void reason required field
4. Partial refunds instead of full void
5. Automatic email notification when sale is voided
6. Daily void limit per user
7. Integration with accounting system for refund tracking
