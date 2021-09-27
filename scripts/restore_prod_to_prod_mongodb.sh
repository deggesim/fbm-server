#!/bin/bash

if [ -z "$1" ]
then
 echo "Param \$1 is empty"
else
 mongorestore \
  --drop \
  --host Cluster0-shard-0/cluster0-shard-00-00.uemcc.mongodb.net,cluster0-shard-00-01.uemcc.mongodb.net,cluster0-shard-00-02.uemcc.mongodb.net \
  --username taskapp \
  --password qkbnt4W9LNYa9bP \
  --authenticationDatabase admin \
  --ssl \
  /var/backups/mongodb/prod/$1
fi
