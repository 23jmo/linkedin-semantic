# Waitlist Configuration

This project includes a centralized waitlist configuration system that allows you to easily switch between normal signup mode and waitlist mode.

## How to Use

### Enable Waitlist Mode

1. Set the environment variable in your `.env.local` file:
   ```
   NEXT_PUBLIC_WAITLIST_MODE=true
   ```

2. Optionally customize the alert message:
   ```
   NEXT_PUBLIC_WAITLIST_MESSAGE="We're at capacity! Join our waitlist to be notified when spots open up."
   ```

3. Restart your development server

### Disable Waitlist Mode (Normal Signup)

1. Set the environment variable in your `.env.local` file:
   ```
   NEXT_PUBLIC_WAITLIST_MODE=false
   ```

2. Or simply omit the variable entirely (defaults to false)

3. Restart your development server

## What Changes

### When Waitlist is Active (`NEXT_PUBLIC_WAITLIST_MODE=true`)

- **LinkedInUrlForm**: Shows the waitlist email capture form instead of the LinkedIn URL form
- **HomeContent**: Displays the waitlist alert message at the top of the page

### When Waitlist is Inactive (`NEXT_PUBLIC_WAITLIST_MODE=false` or omitted)

- **LinkedInUrlForm**: Shows the normal LinkedIn URL signup form
- **HomeContent**: No alert message is displayed

## Files Modified

- `src/lib/waitlist-config.ts` - Centralized configuration logic
- `src/components/LinkedInUrlForm.tsx` - Conditional form rendering
- `src/components/HomeContent.tsx` - Conditional alert display
- `.env.example` - Example environment configuration

## Implementation Details

The system uses Next.js environment variables that are prefixed with `NEXT_PUBLIC_` to make them available in the browser. The configuration is checked at component render time, so changes require a server restart to take effect.

All waitlist logic is contained in the `waitlist-config.ts` utility file, making it easy to modify the behavior in one place.