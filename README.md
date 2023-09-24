# Yoga REST API

This is a REST API for a yoga site where users can register and book classes, and yoga studio employees can manage lessons. The API is built with TypeScript, Express, Prisma ORM and Nodemon, and uses a PostgreSQL database.

## Installation

1.  Clone the repository:
    `git clone https://github.com/verondel/yoga-rest.git`
2.  Install dependencies:
    `npm install`
3.  Create a `.env` file in the project root with the following contents:

    ```
    DATABASE_URL=postgresql://<username>:<password>@<hostname>:<port>/<database>
    LOGIN = 'admin'
    PASSWORD = 'c93ccd78b2076528346216b3b2f701e6'
    SOLE = '1234'
    ```
    
4.  Run database migrations:
    `npx prisma migrate dev`
5.  Start the server:
    `npm run dev`

## API Endpoints

### `GET /typesAndLessons`

Returns information about yoga types and lessons for the main page.

### `GET /attempt`

Attempts to find a user in the database based on their number.

### `GET /auth`

Performs cookie-based authorization.

### `PATCH /api/lessons`

Adds a new lesson to the database.

### `DELETE /api/lessons`

Deletes a lesson from the database.

### `PATCH /api/registration`

Adds a new user to the database.

### `GET /infoForNewLesson`

Returns information about lessons for the admin page.

### `GET /teachers`

Returns full names of teachers and their IDs based on their specialty.

## Authentication

The API uses cookie-based authentication to secure the routes. Users without specific login and password cannot access the special place where yoga studio employees can manage lessons.

## Contributing

If you find a bug or want to suggest a new feature, please open an issue or submit a pull request.

## License

This project is licensed under the Apache License.
