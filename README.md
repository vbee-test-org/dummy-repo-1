# News Aggregator MERN

This project is a news aggregator built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It allows users to view and search for news articles from various sources.

## Requirements

To develop the News Aggregator MERN project, you will need the following:

- Node.js (version 20.12.0 or higher)
- MongoDB (version 7.0.6 or higher)
- Git

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/OOPProject20232/NewsAggregator_MERN.git
    ```

2. Install the dependencies:

    ```bash
    cd NewsAggregator_MERN
    npm install
    ```

3. Set up the environment variables:

    - Create a `.env` file in the root directory of the project.
    - Add the following environment variables to the `.env` file:

      ```plaintext
      PORT=your-desired-port
      MONGODB_URI=your-mongodb-uri
      ```

4. Start the development server:

    ```bash
    npm run start
    ```
    >[!TIP] You can change in `package.json` file key `"start": "node server.js"` to `"start": "nodemon server.js` to hot reload evertime you save changes to a file.

5. Open your browser and navigate to `http://localhost:<PORT>` (or failsafe to `http://localhost:4000`) to check if the server is running.
6. To send requests and test APIs, I recommend using [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/)
<br> This table links to the documentation of how to use APIs </br>

| Objects | Links |
|---------|-------|
| Articles| [Articles_API](docs/Articles_API.md)  |
| Users   | [Users_API](docs/Users_API.md)        |

## Contributing

If you would like to contribute to the News Aggregator MERN project, please follow these guidelines:

- Fork the repository.
- Create a new branch for your feature or bug fix.
- Make your changes and commit them.
- Push your changes to your forked repository.
- Submit a pull request to the main repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
