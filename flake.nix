{
  description = "Dev shell with Node.js (default) and Python";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs, ... }:
    let
      system = "x86_64-linux";  # Adjust if needed (e.g., "aarch64-linux")
      pkgs = import nixpkgs {
        inherit system;
        config = { allowUnfree = true; };
      };

      nodeShell = pkgs.mkShell {
        buildInputs = [ pkgs.nodejs_23 ];
        shellHook = ''
          echo "Welcome to the Node.js development shell!"
        '';
      };

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
          echo "Virtual environment activated. You can now use docling."
          echo "Welcome to the Python development shell!"
        '';
      };
    in {
      devShells.${system} = {
        default = nodeShell;
        node = nodeShell;
        python = pythonShell;
      };

      # Also export a top-level devShell as the default (Node.js)
      devShell = nodeShell;
    };
}
