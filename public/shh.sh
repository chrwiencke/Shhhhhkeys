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
if [ "$0" = "sh" ] || echo "$0" | grep -q "wget"; then
    TEMP_SCRIPT="/tmp/shh_install_$$"
    # Ensure we get the complete script
    cat > "$TEMP_SCRIPT" || exit 1
    
    # Validate script content
    if ! sh -n "$TEMP_SCRIPT"; then
        echo "Error: Invalid script content"
        rm -f "$TEMP_SCRIPT"
        exit 1
    fi
    
    echo "Installing Shhhhhkeys utility to /usr/local/bin/shh..."
    if [ "$(id -u)" = "0" ]; then
        # Running as root/sudo
        if ! install -m 755 "$TEMP_SCRIPT" "/usr/local/bin/shh"; then
            echo "Error: Installation failed"
            rm -f "$TEMP_SCRIPT"
            exit 1
        fi
    else
        # Not running as root, try with sudo
        if ! sudo install -m 755 "$TEMP_SCRIPT" "/usr/local/bin/shh"; then
            echo "Error: Installation failed. Please run with sudo"
            rm -f "$TEMP_SCRIPT"
            exit 1
        fi
    fi
    
    # Verify installed script
    if ! sh -n "/usr/local/bin/shh"; then
        echo "Error: Installation verification failed"
        rm -f "$TEMP_SCRIPT"
        exit 1
    fi
    
    rm -f "$TEMP_SCRIPT"
    echo "Installation successful! You can now use 'shh' command."
    exit 0
fi

if [ "$1" = "-s" ]; then
    if [ "$#" -lt 4 ]; then
        echo "Usage with -s: $0 -s shhkeys_user linux_user title [title2] ..."
        exit 1
    fi
    SHH_USER="$2"
    LINUX_USER="$3"
    shift 3
    
    if ! id "$LINUX_USER" >/dev/null 2>&1; then
        echo "Error: Linux user '$LINUX_USER' does not exist"
        exit 1
    fi
    
    while [ "$#" -gt 0 ]; do
        case "$1" in
            */*) 
                echo "Error: When using -s, titles should not contain '/'. Got: $1"
                exit 1
                ;;
            *) KEYS="$KEYS $SHH_USER/$1" ;;
        esac
        shift
    done
elif [ "$1" = "-u" ]; then
    if [ "$#" -lt 3 ]; then
        echo "Usage with -u: $0 -u linux_user [-s shhkeys_user] title [title2] ..."
        exit 1
    fi
    LINUX_USER="$2"
    shift 2
    
    if [ "$1" = "-s" ]; then
        if [ "$#" -lt 2 ]; then
            echo "Error: -s option requires a username"
            exit 1
        fi
        SHH_USER="$2"
        shift 2
    else
        SHH_USER="$LINUX_USER"
    fi
    
    while [ "$#" -gt 0 ]; do
        case "$1" in
            */*) 
                echo "Error: When using -u, titles should not contain '/'. Got: $1"
                exit 1
                ;;
            *) KEYS="$KEYS $SHH_USER/$1" ;;
        esac
        shift
    done
else
    if [ "$#" -lt 2 ]; then
        echo "Usage: $0 linux_user title [title2...] [-s shhkeys_user]"
        echo "   or: $0 linux_user user/title [user2/title2...] "
        echo "   or: $0 -u linux_user [-s shhkeys_user] title [title2...]"
        echo "   or: $0 -s shhkeys_user linux_user title [title2...]"
        exit 1
    fi
    LINUX_USER="$1"
    shift

    while [ "$#" -gt 0 ]; do
        if [ "$1" = "-s" ]; then
            if [ "$#" -lt 2 ]; then
                echo "Error: -s option requires a username"
                exit 1
            fi
            SHH_USER="$2"
            shift 2
            break
        fi
        case "$1" in
            */*) KEYS="$KEYS $1" ;;
            *) 
                if [ -n "$SHH_USER" ]; then
                    KEYS="$KEYS $SHH_USER/$1"
                else
                    KEYS="$KEYS $LINUX_USER/$1"
                fi
                ;;
        esac
        shift
    done

    while [ "$#" -gt 0 ]; do
        case "$1" in
            */*) 
                echo "Error: After -s flag, titles should not contain '/'. Got: $1"
                exit 1
                ;;
            *) KEYS="$KEYS $SHH_USER/$1" ;;
        esac
        shift
    done
fi

USER_HOME=$(getent passwd "$LINUX_USER" | cut -d: -f6)

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
    RESPONSE=$(curl -s -w "\n%{http_code}" "https://shh.pludo.org/$key")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    KEY_CONTENT=$(echo "$RESPONSE" | sed '$d')
    
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