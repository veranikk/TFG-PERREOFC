<!--
Documents the backend API endpoints for notifications.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Notification Endpoints

Endpoints related to user notifications.

## List Notifications
Returns a list of notifications for the current user.

- **URL:** `/notifications`
- **Method:** `GET`
- **Auth required:** Yes

---

## Get Unread Count
Returns the number of unread notifications.

- **URL:** `/notifications/unread`
- **Method:** `GET`
- **Auth required:** Yes

---

## Mark as Read
Marks a specific notification as read.

- **URL:** `/notifications/:notificationId`
- **Method:** `PUT`
- **Auth required:** Yes

---

## Mark All as Read
Marks all notifications for the current user as read.

- **URL:** `/notifications/mark-all-read`
- **Method:** `POST`
- **Auth required:** Yes

---

## Delete Notification
Deletes a specific notification.

- **URL:** `/notifications/:notificationId`
- **Method:** `DELETE`
- **Auth required:** Yes
