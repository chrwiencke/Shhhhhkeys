#!/bin/sh

LINUX_USER=""
KEYS=""

if [ "$1" = "-u" ]; then
    if [ "$#" -lt 3 ]; then
        echo "Usage with -u: $0 -u linux_user title [title2] ..."
        exit 1
    fi
    LINUX_USER="$2"
    shift 2
    while [ "$#" -gt 0 ]; do
        KEYS="$KEYS $LINUX_USER/$1"
        shift
    done
else
    if [ "$#" -lt 2 ]; then
        echo "Usage without -u: $0 linux_user user/title [user2/title2] ..."
        exit 1
    fi
    LINUX_USER="$1"
    shift
    while [ "$#" -gt 0 ]; do
        case "$1" in
            */*) KEYS="$KEYS $1" ;;
            *)
                echo "Error: When not using -u, arguments must be in the format user/title"
                exit 1
                ;;
        esac
        shift
    done
fi

USER_HOME=$(getent passwd "$LINUX_USER" | cut -d: -f6)

if [ -z "$USER_HOME" ] || [ ! -d "$USER_HOME" ]; then
    echo "User '$LINUX_USER' does not exist or does not have a valid home directory."
    exit 1
fi

SSH_DIR="$USER_HOME/.ssh"
AUTHORIZED_KEYS="$SSH_DIR/authorized_keys"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

touch "$AUTHORIZED_KEYS"
chmod 600 "$AUTHORIZED_KEYS"

for key in $KEYS; do
    echo "Fetching key from: https://shh.pludo.org/$key"
    curl -s "https://shh.pludo.org/$key" >> "$AUTHORIZED_KEYS"
    echo "" >> "$AUTHORIZED_KEYS"
done

chown -R "$LINUX_USER:$LINUX_USER" "$SSH_DIR"
echo "SSH keys added successfully for user '$LINUX_USER'."