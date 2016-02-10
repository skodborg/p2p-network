START=$1
STOP=$2

for (( c=$START; c<=$STOP; c++ ))
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