== The Harvestar (aka AI-Colony)

This repository contains the community version of AI-Colony.
== Getting started

In order to run the application follow these steps:
1. Install TorqueBox v2.1.2 (download it here[http://torquebox.org/release/org/torquebox/torquebox-dist/2.1.2/torquebox-dist-2.1.2-bin.zip] and follow these[http://torquebox.org/documentation/2.1.2/installation.html] instructions).
2. Install the Cloud-TM modules into Torquebox (you can find more details here[http://github.com/algorithmica/cloudtm-jboss-modules])
3. Clone the project
4. Install the needed gem libraries:
   open a shell,
   cd to the project folder
   and run
    jruby -S bundle install
   <b>Note</b>: if you are on a linux machine you must add two gems to the Gemfile <em>before executing the bundle install</em>
   open the Gemfile (in the root of the application) and add
    gem 'execjs'
    gem 'therubyracer'
5. Setup the database (make sure sqlite3 is installed):
    jruby -S rake db:setup
6. Deploy the application into TorqueBox by executing this command in the project folder:
    jruby -S rake torquebox:deploy
7. Run TorqueBox:
    jruby -S rake torquebox:run
8. Run the Socky Websockets server by executing this command in the project folder:
    jruby -S socky -c socky_server.yml
9. Open the browser at http://localhost:8080, signup and access AI-Colony.

Credits
-------

![Algorithmica](http://algorithmica.it/images/logo.png)

The Harvestar is owned by [Algorithmica Srl](http://algorithmica.it).
This project is part of the Specific Targeted Research Project (STReP) Cloud-TM[http://www.cloudtm.eu] and is partially funded by the
European Commission under the Seventh Framework Programme for Research and Technological Development (FP7 - 2007-2013) with contract no. 257784.


The names and logos for Algorithmica are trademarks of Algorithmica Srl.



Copyright
---------

Madmass is Copyright (c) 2010-2013 Algorithmica Srl. It is free software, and may be redistributed under the terms specified in the
LICENSE.txt file.
