# Implementation Plan: Phone Number Onboarding Flow

## Objective
Implement a phone number onboarding flow for newly registered users (OAuth/Social Login) to ensure every user is linked to a record in the `members` table.

## User Flow
1. **Trigger**: After a user signs in, if their profile lacks a phone number, redirect them to the `/onboarding/phone` page.
2. **Input**: User enters their phone number (without +62 prefix).
3. **Lookup**: Call `GET /members/search-by-phone?phone={input}`.
4. **Branching Logic**:
   - **Case A: Member Found (200 OK)**
     - Display: "An existing member account was found with this phone number."
     - Action: Prompt user to "Connect Account".
     - API: `POST /users/connect-member`
       - Body: `{ memberId: string, phoneNumber: string }`
   - **Case B: Member Not Found (404 Not Found)**
     - Display: "New member account will be created."
     - Action: Prompt for "Name" (pre-fill from OAuth if available) and "Confirm".
     - API: `POST /users/create-member`
       - Body: `{ name: string, phoneNumber: string }`
5. **Completion**: Upon success, redirect to the dashboard.

## API Reference

### 1. Search Member by Phone
- **Endpoint**: `GET /members/search-by-phone`
- **Query Params**: `phone` (e.g., `8123456789`)
- **Response (Success)**: 
  ```json
  {
    "status": "success",
    "data": { "memberId": "m-xxxxxx", "name": "...", "phoneNumber": "..." }
  }
  ```

### 2. Connect Existing Member
- **Endpoint**: `POST /users/connect-member`
- **Auth**: Required (Bearer Token/Session)
- **Body**:
  ```json
  {
    "memberId": "m-xxxxxx",
    "phoneNumber": "8123456789"
  }
  ```

### 3. Create New Member Connection
- **Endpoint**: `POST /users/create-member`
- **Auth**: Required (Bearer Token/Session)
- **Body**:
  ```json
  {
    "name": "User Name",
    "phoneNumber": "8123456789"
  }
  ```

## Implementation Notes
- The backend automatically prepends `+62` to the `phoneNumber` before saving.
- Ensure the phone number input validation matches the regex: `^\+?[0-9\s\-()]+$`.
- Handle error states (e.g., network errors, 500s) gracefully with toasts.
