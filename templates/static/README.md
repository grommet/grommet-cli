# Grommet static project

This project has the structure needed to generate static sites that
can be deployed to github pages, for example.

To run this application, execute the following commands:

  1. Install NPM modules

    ```
    $ npm install
    ```

  2. Start the development server:

    ```
    $ gulp dev
    ```

  3. Create the app distribution to be used by the back-end server

    ```
    $ gulp dist
    ```

  4. Create the app distribution as static html files

    ```
    $ gulp dist --config static-webpack.config.babel.js
    ```
