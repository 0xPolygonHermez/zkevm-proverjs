#!/bin/bash
rm -rf node1/geth

cp genesis.json node1/genesis.json

geth init --datadir node1 genesis.json

bootnode -nodekey boot.key -addr 127.0.0.1:30305 &

geth --datadir node1 --port 30306 --bootnodes "enode://049dbbe3dd9c4409b484131124ce47943e532a2de504b4cc80b8a15635c812b42cc064aaa3ba36794221cfed936a5f18932f48488bdb1d101ba3490d407f30ac@127.0.0.1:0?discport=30305" --networkid 1000 --unlock 0x67d13ABa5613169Ea7C692712d14A69e068558F8 --password node1/pass.txt --http --http.addr "0.0.0.0" --http.corsdomain="*" --http.api="eth,web3,net,admin,personal,txpool,debug" --authrpc.port 8552 --mine --miner.etherbase 0x67d13ABa5613169Ea7C692712d14A69e068558F8 --miner.gasprice 0 --allow-insecure-unlock --rpc.allow-unprotected-txs
