# Generating zkevm-prover setup

Lets start by launching an instance.

## Basic OS preparation

```bash
sudo apt update
sudo apt install -y tmux git curl jq
```

## Tweaking the OS to accept high amount of memory.

```bash
echo "vm.max_map_count=655300" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w vm.max_map_count=655300
export NODE_OPTIONS="--max-old-space-size=230000"
```

## Install version of node and npm

```bash
curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install -y nodejs
node -v
```

The version of node should be: 18 (e.g. 18.19.0 )

## Download and prepare circom

To compile circuits, we need circom installed.

```bash
cd ~
git clone https://github.com/iden3/circom.git
cd circom
git checkout v2.1.8
git log --pretty=format:'%H' -n 1
```

The hash of the commit should be: f0deda416abe91e5dd906c55507c737cd9986ab5

Install and compile circom (RUST)

```bash
cd ~
sudo apt install -y cargo
cd circom
cargo build --release
cargo install --path circom
export PATH=$PATH:~/.cargo/bin
echo 'PATH=$PATH:~/.cargo/bin' >> ~/.profile
circom --version
```

The version of circom should be: 2.1.8

## Install SNARKjs

```bash
npm install -g snarkjs
```

## Prepare fast build constant tree tool

```bash
cd ~
git clone https://github.com/0xPolygonHermez/zkevm-prover.git
cd zkevm-prover
git checkout develop
make clean
git submodule init
git submodule update
sudo apt install -y build-essential libomp-dev libgmp-dev nlohmann-json3-dev libpqxx-dev nasm libgrpc++-dev libprotobuf-dev grpc-proto libsodium-dev uuid-dev libsecp256k1-dev
make -j bctree
make -j fflonk_setup
```

## Prepare and launch setup (zkevm-proverjs)

```bash
cd ~
git clone https://github.com/0xPolygonHermez/zkevm-proverjs.git
cd zkevm-proverjs
git checkout test_2_25
npm install
```

To generate setup for N=2^24
```bash
tmux -c "npm run buildsetup --build=build/setup_24 --bctree=../zkevm-prover/build/bctree --fflonksetup=../zkevm-prover/build/fflonkSetup"
```

To generate setup for N=2^25
```bash
tmux -c "npm run buildsetup --build=build/setup_25 --bctree=../zkevm-prover/build/bctree --fflonksetup=../zkevm-prover/build/fflonkSetup --mode=25"
```

Notice that the first time the process will also need to download powersOfTau28_hez_final.ptau will inside `build` folder, which is a 288GB file. This will happen only once and takes two hours.

## Copying files to zkevm-prover

To generate proofs for N=24 or N=25, the only that needs to be done is to create a virtual link to the config files. This are inside the build directory specified when building the setup. For example, for N=24 would be:

```bash
cd ~
cd zkevm-prover
rm -rf config
ln -s ../zkevm-proverjs/build/setup_24/config config
```

For N=24, only `WORKING_DIR` version needs to be modified by specifying the directory in which the setup has been built.
```bash
WORKING_DIR=../zkevm-proverjs/build/setup_24/
```

For N=25, in addition to modify the `WORKING_DIR`, the `VERSION` needs to be modified so that instead of `fork.10`, it points to `fork.11`

```bash
VERSION=v7.0.0-rc.1-fork.10 ----> VERSION=v7.0.0-rc.1-fork.11
```

For N=25, the `PROVER_FORK_ID` will also need to be modified inside `src/config/definitions.hpp`
```bash
PROVER_FORK_ID 10 ----> PROVER_FORK_ID 11
```

Once all of this, the files are copied by executing the script

```bash
cd ~
cd zkevm-prover
./tools/copy_generate_files.sh
```

## Compiling zkevm-prover

As mentioned above, if N = 25, the `PROVER_FORK_ID` needs to be modified inside `src/config/definitions.hpp` if not already done
```bash
PROVER_FORK_ID 10 ----> PROVER_FORK_ID 11
```

Inside `src/config/definitions.hpp`, you can decide if you prefer to use the memory reduced version or not by modifying `REDUCE_ZKEVM_MEMORY` parameter.

Also, to improve compilation time, the following two lines can be commented.

```bash
#define MAIN_SM_EXECUTOR_GENERATED_CODE
#define MAIN_SM_PROVER_GENERATED_CODE
```

You may first need to recompile the protobufs:
```sh
cd src/grpc
make
cd ../..
```

Finally, to compile the CPU prover

```bash
make -j generate
make -j cpu
```

Instead, if you want to compile the GPU prover

```bash
make -j generate
make -j gpu
```
