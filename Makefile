# Makefile for packaging KubeJS mod

# Variables
MOD_NAME = simplelootbags
VERSION = 0.7.0
ZIP_FILE = $(MOD_NAME)-$(VERSION).zip

# Directories
KUBEJS_DIR = kubejs
CLIENT_SCRIPTS_DIR = $(KUBEJS_DIR)/client_scripts
SERVER_SCRIPTS_DIR = $(KUBEJS_DIR)/server_scripts
ASSETS_DIR = $(KUBEJS_DIR)/assets
CONFIG_DIR = $(KUBEJS_DIR)/config

# Files
MODRINTH_JSON = modrinth.json
PACK_MCMETA = pack.mcmeta

# Default target
all: clean package

# Clean up previous builds
clean:
	@echo "Cleaning up previous builds..."
	@rm -f $(ZIP_FILE)

# Package the mod into a ZIP file
package: clean
	@echo "Packaging the mod..."
	@zip -r $(ZIP_FILE) $(KUBEJS_DIR) $(MODRINTH_JSON) $(PACK_MCMETA)

# Help command
help:
	@echo "Makefile commands:"
	@echo "  make            - Build the mod package"
	@echo "  make clean      - Remove previous build files"
	@echo "  make package    - Create the mod package"
	@echo "  make help       - Show this help message"

.PHONY: all clean package help

