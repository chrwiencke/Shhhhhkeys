#!/bin/sh

# Shhhhhkeys - SSH Key Management Utility
# 
# Description:
#   A utility for managing SSH keys by downloading them from shh.pludo.org and
#   adding them to a user's authorized_keys file.
#
# Usage:
#   1. Basic usage (with user/title format):
#      sh shh.sh linuxuser user1/key1 user2/key2
#
#   2. Using Linux username as SSH key username:
#      sh shh.sh linuxuser key1 key2
#      # This will fetch linuxuser/key1 and linuxuser/key2
#
#   3. Using -u flag (simpler format):
#      sh shh.sh -u linuxuser key1 key2
#      # This will fetch linuxuser/key1 and linuxuser/key2
#
#   4. Using -s flag to specify SSH key username:
#      sh shh.sh -s sshuser linuxuser key1 key2
#      # This will fetch sshuser/key1 and sshuser/key2
#
#   5. Mixed format with -s flag:
#      sh shh.sh linuxuser key1 user2/key2 -s sshuser key3
#      # This will fetch linuxuser/key1, user2/key2, and sshuser/key3
#
# Options:
#   -u             Use Linux username as SSH key username for all keys
#   -s username    Use specified username for SSH keys
#
# Arguments:
#   linuxuser     The local Linux username to add keys for
#   user/title    Full key path in user/title format
#   title         Simple key title (used with -u or -s)
#
# Examples:
#   sh shh.sh john alice/laptop bob/desktop
#   sh shh.sh -u john laptop desktop
#   sh shh.sh -s alice john work-laptop home-desktop
#   sh shh.sh john key1 bob/key2 -s alice key3
#
# Notes:
#   - Requires appropriate permissions to modify the target user's .ssh directory
#   - Will create .ssh directory and authorized_keys file if they don't exist
#   - Sets appropriate permissions (700 for .ssh, 600 for authorized_keys)
#   - Validates user existence and home directory before proceeding
#   - Returns clear error messages for common issues

LINUX_USER=""
KEYS=""
SHH_USER=""

# Self-installation when downloaded via wget
case "$0" in
    sh|*/sh)
        TEMP_SCRIPT="/tmp/shh_install_$$"
        cat > "$TEMP_SCRIPT" || exit 1
        
        echo "Installing Shhhhhkeys utility to /usr/local/bin/shh..."
        if [ "`id -u`" = "0" ]; then
            # Running as root/sudo
            cp "$TEMP_SCRIPT" "/usr/local/bin/shh" && \
            chmod 755 "/usr/local/bin/shh"
            INSTALL_STATUS=$?
        else
            # Not running as root, try with sudo
            sudo cp "$TEMP_SCRIPT" "/usr/local/bin/shh" && \
            sudo chmod 755 "/usr/local/bin/shh"
            INSTALL_STATUS=$?
        fi

        if [ $INSTALL_STATUS -eq 0 ]; then
            echo "Installation successful! You can now use 'shh' command."
            rm -f "$TEMP_SCRIPT"
            exit 0
        else
            echo "Error: Installation failed. Please run with sudo."
            rm -f "$TEMP_SCRIPT"
            exit 1
        fi
        ;;
esac

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [-u|-s shhkeys_user] linux_user title [title2...]"
    echo "   or: $0 linux_user [-u|-s shhkeys_user] title [title2...]"
    echo "   or: $0 linux_user title [title2...] [-u|-s shhkeys_user]"
    exit 1
fi

# Initialize variables
LINUX_USER=""
KEYS=""
SHH_USER=""
FOUND_USER=0

# Parse all arguments first to find flags
for arg in "$@"; do
    case "$arg" in
        "-u"|"-s") FOUND_FLAG=1 ;;
    esac
done

# Process arguments
while [ $# -gt 0 ]; do
    case "$1" in
        "-u")
            if [ $FOUND_USER -eq 0 ]; then
                shift
                LINUX_USER="$1"
                SHH_USER="$1"
                FOUND_USER=1
            else
                SHH_USER="$LINUX_USER"
            fi
            shift
            ;;
        "-s")
            shift
            if [ $# -eq 0 ]; then
                echo "Error: -s option requires a username"
                exit 1
            fi
            SHH_USER="$1"
            if [ $FOUND_USER -eq 0 ] && [ $# -gt 1 ]; then
                shift
                LINUX_USER="$1"
                FOUND_USER=1
            fi
            shift
            ;;
        *)
            if [ $FOUND_USER -eq 0 ]; then
                LINUX_USER="$1"
                [ -z "$SHH_USER" ] && SHH_USER="$1"
                FOUND_USER=1
                shift
            else
                case "$1" in
                    */*) KEYS="$KEYS $1" ;;
                    *) KEYS="$KEYS $SHH_USER/$1" ;;
                esac
                shift
            fi
            ;;
    esac
done

# Validate required arguments
if [ -z "$LINUX_USER" ]; then
    echo "Error: Linux user not specified"
    exit 1
fi

if [ -z "$KEYS" ]; then
    echo "Error: No keys specified"
    exit 1
fi

# Validate Linux user exists and has a valid home directory
USER_HOME=`getent passwd "$LINUX_USER" | cut -d: -f6`
if [ -z "$USER_HOME" ] || [ ! -d "$USER_HOME" ]; then
    echo "Error: User '$LINUX_USER' does not exist or does not have a valid home directory."
    exit 1
fi

SSH_DIR="$USER_HOME/.ssh"
AUTHORIZED_KEYS="$SSH_DIR/authorized_keys"

if ! mkdir -p "$SSH_DIR" 2>/dev/null; then
    echo "Error: Unable to create directory $SSH_DIR. Check permissions."
    exit 1
fi

if ! chmod 700 "$SSH_DIR" 2>/dev/null; then
    echo "Error: Unable to set permissions on $SSH_DIR"
    exit 1
fi

if ! touch "$AUTHORIZED_KEYS" 2>/dev/null; then
    echo "Error: Unable to create/update $AUTHORIZED_KEYS"
    exit 1
fi

if ! chmod 600 "$AUTHORIZED_KEYS" 2>/dev/null; then
    echo "Error: Unable to set permissions on $AUTHORIZED_KEYS"
    exit 1
fi

for key in $KEYS; do
    echo "Fetching key from: https://shh.pludo.org/$key"
    RESPONSE=`curl -s -w "\n%{http_code}" "https://shh.pludo.org/$key"`
    HTTP_CODE=`echo "$RESPONSE" | tail -n1`
    KEY_CONTENT=`echo "$RESPONSE" | sed '$d'`
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo "Error: Failed to fetch key from https://shh.pludo.org/$key (HTTP $HTTP_CODE)"
        continue
    fi
    
    if [ -z "$KEY_CONTENT" ]; then
        echo "Error: Empty key content received for $key"
        continue
    fi
    
    if ! echo "$KEY_CONTENT" | grep -q "^ssh-"; then
        echo "Error: Invalid SSH key format received for $key"
        echo "Content received: $KEY_CONTENT"
        continue
    fi
    
    echo "Adding key: $key"
    echo "$KEY_CONTENT" >> "$AUTHORIZED_KEYS"
    echo "" >> "$AUTHORIZED_KEYS"
done

# Verify keys were added
if ! grep -q "^ssh-" "$AUTHORIZED_KEYS"; then
    echo "Warning: No SSH keys were added to $AUTHORIZED_KEYS"
    exit 1
fi

if ! chown -R "$LINUX_USER:$LINUX_USER" "$SSH_DIR" 2>/dev/null; then
    echo "Error: Unable to change ownership of $SSH_DIR"
    exit 1
fi

echo "SSH keys added successfully for user '$LINUX_USER'."