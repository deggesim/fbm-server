#!/bin/bash

if [ -z "$1" ]
then
 echo "Param \$1 is empty"
else
 mongorestore --drop --nsInclude='fbm.*' /var/backups/mongodb/prod/$1
fi
