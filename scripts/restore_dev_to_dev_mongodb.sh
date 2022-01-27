#!/bin/bash

if [ -z "$1" ]
then
 echo "Param \$1 is empty"
else
 mongorestore --drop --nsInclude='fbm.*' /var/backups/mongodb/dev/$1
fi
