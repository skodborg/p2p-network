PEERS=$1
LASTPEER=`expr 4000 + $PEERS - 1`
SNDLASTPEER=`expr $LASTPEER - 1`

# PORT=4000 PORTSUCC=4001 PORTPRED=$LASTPEER npm start &
# PORT=4000 PORTSUCC=4000 PORTPRED=4000 NOHASHING=true STABILIZE=ON npm start &
PORT=4000 PORTSUCC=4000 PORTPRED=4000 STABILIZE=ON npm start &

for (( c=4001; c<=$SNDLASTPEER; c++ ))
do
  echo $c
  prev=`expr $c - 1`
  next=`expr $c + 1`
  # PORT=$c PORTSUCC=$next PORTPRED=$prev npm start &
  # PORT=$c PORTSUCC=null PORTPRED=null JOIN=true NOHASHING=true STABILIZE=ON npm start &
  PORT=$c PORTSUCC=null PORTPRED=null JOIN=true STABILIZE=ON npm start &
done

read

killall node
killall npm

# PORT=$LASTPEER PORTSUCC=4000 PORTPRED=$SNDLASTPEER npm start &