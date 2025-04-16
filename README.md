# HTTPLens

HTTPLens is a Visual Studio Code extension that enhances your C# web API development workflow by providing CodeLens actions to quickly create and navigate to HTTP request test files. It streamlines the process of generating and managing `.http` files for your API endpoints, making it easier to test and debug your APIs directly from your editor.

## Features

- **CodeLens for C# Endpoints:** Adds CodeLens actions above your C# controller actions and minimal API routes to:
  - Create a corresponding `.http` test file for the endpoint if it doesn't exist.
  - Quickly navigate to the existing `.http` test file for the endpoint.
- **Automatic HTTP Request Generation:** Generates a ready-to-use HTTP request template for your endpoint, using the method and route detected from your code.
- **Seamless Navigation:** Jump directly from your C# code to the relevant HTTP test file for fast testing and iteration.

![Example Navigation](https://github.com/user-attachments/assets/c5bb1807-6b12-4ad8-954d-12337cd4f6dd)

## Installation

1. Install from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/) or by searching for "HTTPLens" in the Extensions view.
2. Reload VS Code if required.

## Requirements

- Visual Studio Code v1.99.0 or higher
- Designed for C# projects using ASP.NET Core (controllers or minimal APIs)

## Usage

1. Open a C# file containing controller actions or minimal API routes.
2. Look for the `Create HTTP Test` or `Go to HTTP Test` CodeLens above your endpoint methods.
3. Click `Create HTTP Test` to generate a new `.http` file with a request template for the endpoint.
4. Click `Go to HTTP Test` to open the existing test file for that endpoint.

The generated `.http` files are placed in a `tests/http/` folder in your workspace. The extension tries to detect your application's base URL from `launchSettings.json` if available.

## Extension Settings

This extension does not currently contribute any user-configurable settings.

## Known Issues

- Only supports C# files and standard ASP.NET Core patterns (controllers and minimal APIs).
- Does not support custom routing attributes or advanced route patterns.

Please report issues or feature requests on the [GitHub Issues page](https://github.com/timheuer/httplens/issues).


## Contributing

Contributions are welcome! Please see the [GitHub repository](https://github.com/timheuer/httplens) for details on how to contribute, submit issues, or request features.

## License

MIT
