# Shhhhhkeys 🔑

A simple and secure way to manage your SSH keys across multiple machines. Upload, create, and manage your SSH keys in one place, then access them anywhere with a simple curl command.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## 🚀 Features

- **Easy Upload**: Upload your existing SSH keys in just two clicks
- **Quick Access**: Retrieve your keys instantly using curl or wget on any machine
- **Key Management**: Create, delete, and manage multiple SSH keys from a single dashboard
- **Secure Storage**: Your SSH keys are stored securely in our database
- **Multiple Access Methods**: Choose between direct downloads or our utility script

## 📖 Quick Start

### Direct Download Method

Add a single SSH key to your authorized_keys file:
```bash
curl https://shh.pludo.org/chw/title >> ~/.ssh/authorized_keys
```

Add all SSH keys for a user:
```bash
curl https://shh.pludo.org/chw/keys >> ~/.ssh/authorized_keys
```

### Using the SSH Key Utility

1. **Install the Utility**
   ```bash
   wget https://shh.pludo.org/shh.sh
   sudo install -m 755 shh.sh /usr/local/bin/shh
   ```

2. **Basic Usage**
   ```bash
   shh <linux-user> <key-identifier>...
   ```

3. **Examples**

   Add a single key:
   ```bash
   shh johndoe user1/work-laptop
   ```

   Add multiple keys:
   ```bash
   shh johndoe alice/key1 bob/key2
   ```

### Shortcuts

Use the same username for all keys:
```bash
shh -u johndoe laptop desktop
```

Specify a single SSH key username for all keys:
```bash
shh -s alice johndoe key1 key2
```

## 🔒 Security

All SSH keys are stored securely in our database. Our platform is designed with security as a top priority to ensure your keys remain protected.

## 🌐 Web Interface

Visit [shh.pludo.org](https://shh.pludo.org) to:
- Create an account
- Upload and manage your SSH keys
- Access your dashboard
- Upload your keys

## 📚 Documentation

For more detailed information and advanced usage, visit our [documentation](https://shh.pludo.org/docs).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
