# Installation

## Machine Dependencies

There are two types of installations that need to be performed in order for
everything to work. There are the dependencies of the application itself, and
there are dependencies that are needed to actually install the dependencies.

These only need to be installed once on the machine you're developing on, and it's finished
for good. However, it can be tricky to do this initially, and the process for installation
may vary depending on your operating system. It seems to be *most difficult* to install everything
on Windows. On Linux / OSX, the process seems to be a bit easier, so if possible, use one
of these platforms.

Here are the dependencies that you need to install:

- Git: This is used forj
- Node.js: This is used for the development environment, mostly grunt. It also installs npm, which will download app specific dependencies
- Ruby: Required for compass
- Compass: Compiles Sasss style files into CSS. This isn't needed to run, but the application will look wierd without it. On Windows in particular this can be challengin to install
- Grunt-Cli: This is installed with npm, but globally rather than locally. Install this with `npm install -g grunt-cli` or `sudo npm install -g grunt-cli` depending on your platform.
- Bower: This is also installed like grunt-cli, it allows you to run the `bower` command. Install with `npm install -g bower` or `sudo npm install -g bower` depending on your platform.

These all only need to be installed once, and then they will persist on that machine permanantly until they are uninstalled. It may be painful, but luckily you only have to do it it once, and the functionality that these provide more than make up for the tough installation process.

## Application Dependencies

Now that you're  computer can run everything, it's time to install the application, and get it to a running state

First clone the application onto your local machine with git:

```bash
git clone https://github.com/UW-itemMirror-apps/item-mirror-angular-demo.git
```

This creates a new folder with the application. You now need to go into this directory.

```bash
cd item-mirror-angular-dems
```

Now within this folder, you have need to install several dependencies from npm and bower.

```
npm install
bower install
```

Executing these commands will install dependencies for the application. If bower seems to hang and never end, you may
have to enter your GitHub credentials. the reason is because you're downloading the ItemMirror library, which is private
and therefor requires authentication.

After doing this, everything should be installed, and the application will run by executing the following:

```bash
grunt serve
```

If this fails, perhaps because of a missing dependency, see if you can't install it, but otherwise try `grunt serve --force`, which will ignore any erros or warnings. If you're missing a dependency.

If everything works, then a new tab will pop up in your browser with the application. *Enable Pop Ups*, and then press start. A dropbox popup will ask for authentication, and then finally, the application should be showing the contents of your dropbox folder in the left pane.