{
  description = "Dev shells with Node.js, Python, and a persistent Neo4j wrapper";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # The Neo4j flake with the wrapper
    dcnNeo4j = {
      url = "github:DavidRConnell/neo4j";
      # Forward the nixpkgs input
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, dcnNeo4j, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config = { allowUnfree = true; };
      };

      # Use an if-else check to handle the possible absence of HOME at evaluation time
      homeDir = let
        h = builtins.getEnv "HOME";
      in if h == null || h == "" then "/tmp" else h;

      # Construct the final path for Neo4j's data directory
      neo4jDataPath = "${homeDir}/.local/share/neo4j/my-db";

      #
      # 1) Node Shell
      #
      nodeShell = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_23
        ];
        shellHook = ''
          echo "Welcome to the Node.js development shell!"
        '';
      };

      #
      # 2) Python Shell
      #
      pythonShell = pkgs.mkShell {
        buildInputs = [
          pkgs.python312
          pkgs.python312Packages.pip
          pkgs.python312Packages.fastapi
          pkgs.python312Packages.numpy
          pkgs.python312Packages.python-multipart
          pkgs.python312Packages.uvicorn
          pkgs.python312Packages.ruff
          pkgs.python312Packages.ipython
          pkgs.python312Packages.sqlmodel
          pkgs.python312Packages.alembic
          pkgs.python312Packages.passlib
	  pkgs.python312Packages.faker
          pkgs.python312Packages.neo4j
        ];

        shellHook = ''
          # Create or activate a virtual environment in .venv
          if [ ! -d ".venv" ]; then
            echo "Creating virtual environment in .venv"
            python -m venv .venv
            source .venv/bin/activate
            echo "Upgrading pip and installing docling..."
            pip install --upgrade pip
            pip install docling
            pip install haystack-ai accelerate "sentence-transformers>=3.0.0" "datasets>=2.6.1"
          else
            echo "Activating existing virtual environment (.venv)"
            source .venv/bin/activate
          fi

          echo "Virtual environment activated. You can now use docling and connect to Neo4j."
          echo "Welcome to the Python development shell!"
        '';
      };

      #
      # 3) Persistent Neo4j Shell (Wrapper)
      #
      #   We override the 'neo4jWrapper' derivation to:
      #    - Use a writable data directory (neo4jDataPath)
      #    - Disable auth (auth-enabled = false)
      #    - Add a plugin (e.g., GDS)
      #
      neo4jWrapper = dcnNeo4j.packages.${system}.neo4jWrapper.override {
        db-home = neo4jDataPath;
        auth-enabled = false;
        plugins = [
          dcnNeo4j.plugins.${system}.gds
        ];
      };

      neo4jShell = pkgs.mkShell {
        buildInputs = [ neo4jWrapper ];
        shellHook = ''
          echo "============================================"
          echo "Welcome to the persistent Neo4j dev shell!"
          echo " - Data stored at: ${neo4jDataPath}"
          echo " - Auth enabled? false (no password prompt)"
          echo " - GDS plugin included"
          echo
          echo "To start Neo4j in the foreground, run:"
          echo "  neo4j console"
          echo "============================================"
        '';
      };
    in {
      # Provide multiple dev shells for the same system
      devShells.${system} = {
        default = nodeShell;
        node = nodeShell;
        python = pythonShell;
        neo4j = neo4jShell;
      };

      # Also export a top-level devShell as the default (Node.js)
      devShell = nodeShell;
    };
}
