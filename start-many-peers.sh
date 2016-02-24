PEERS=$1
LASTPEER=`expr 4000 + $PEERS - 1`

# PORT=4000 PORTSUCC=4000 PORTPRED=4000 STABILIZE=ON HASH=1 npm start &
PORT=4000 PORTSUCC=4000 PORTPRED=4000 STABILIZE=ON npm start &

for (( c=4001; c<=$LASTPEER; c++ ))
do
  echo $c
  prev=`expr $c - 1`
  next=`expr $c + 1`
  PORT=$c PORTSUCC=null PORTPRED=null JOIN=true STABILIZE=ON npm start &
  sleep 2
  # PORT=$c PORTSUCC=null PORTPRED=null JOIN=true STABILIZE=ON NOHASHING=true npm start &
done

# wait for "Enter" keypress to kill all servers
read

killall node
killall npm
