#!/bin/bash

timestamp=`date +%Y%m%d-%H%M`
sudo mongodump --db=fbm --out=/var/backups/mongodb/dev/${timestamp}
sudo mongodump --db=fbm --username=taskapp --password=qkbnt4W9LNYa9bP --out=/var/backups/mongodb/prod/${timestamp} --authenticationDatabase=admin --ssl --host="Cluster0-shard-0/cluster0-shard-00-00.uemcc.mongodb.net,cluster0-shard-00-01.uemcc.mongodb.net,cluster0-shard-00-02.uemcc.mongodb.net"
