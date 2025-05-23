# AR Whiteboard

A collaborative augmented reality whiteboard application built with Node.js, Express, Socket.IO, and vanilla JavaScript for the frontend.

## Features

*   Real-time collaborative drawing (pencil, basic shapes).
*   Participant list.
*   Local session saving/loading (using browser localStorage).
*   Theme toggler.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    cd YOUR_REPOSITORY_NAME
    ```
2.  **Install backend dependencies:**
    ```bash
    npm install
    ```
3.  **Generate SSL Certificates (for HTTPS server):**
    Navigate to the `certs/` directory (create it if it doesn't exist).
    ```bash
    cd certs
    openssl genrsa -out key.pem 2048
    openssl req -new -key key.pem -out csr.pem 
    # Answer the prompts, for Common Name use 'localhost' if testing locally
    openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
    cd .. 
    ```
    *(Note: If you decided to commit your `certs/` folder with `key.pem` and `cert.pem`, you can skip this SSL generation step in the README and remove it from `.gitignore`)*
4.  **Ensure your frontend `js/script.js` points to the correct backend URL.** For local testing with the local server, it should be:
    ```javascript
    // socket = io('https://localhost:3001');
    ```

## Running the Application

1.  **Start the backend server:**
    From the project root:
    ```bash
    node server.js
    ```
    The server will run on `https://localhost:3001`.

2.  **Access the frontend:**
    Open `index.html` or `host.html` in your browser (e.g., `file:///path/to/project/index.html` or use a simple HTTP server like `http-server`).

## Tech Stack

*   **Backend:** Node.js, Express.js, Socket.IO
*   **Frontend:** HTML, CSS, JavaScript, Bootstrap
*   **Real-time Communication:** WebSockets (via Socket.IO)

## TODO / Future Enhancements

*   Full AR integration using WebXR.
*   Collaborative text tool and eraser.
*   More robust session state synchronization for new joiners.
*   User authentication.
