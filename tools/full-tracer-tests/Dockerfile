FROM ethereum/client-go:latest

COPY node1 /node1
COPY boot.key /
COPY genesis.json /
COPY start.sh /
RUN chmod +x start.sh
EXPOSE 8545
ENTRYPOINT [ "sh", "start.sh" ]

# docker run -p 8545:8545 geth-poa