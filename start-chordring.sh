PORT=2000 PORTSUCC=2002 PORTPRED=2004 npm start &
PORT=2002 PORTSUCC=2004 PORTPRED=2000 npm start &
PORT=2004 PORTSUCC=2000 PORTPRED=2002 npm start &

# run using:
#   . start-three-ring.sh

# close by killing all npm- and node-processes
#   ps -> kill ###
# where ### is the nr describing the processes