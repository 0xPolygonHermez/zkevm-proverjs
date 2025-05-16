#!/bin/bash
#set -ex

INPUT_DIR=${1:-"./build/proof"}
OUTPUT_DIR=${2:-"./build/config"}

mkdir -p $OUTPUT_DIR/c12a
cp -r $INPUT_DIR/c12* $OUTPUT_DIR/c12a

mkdir -p $OUTPUT_DIR/final
cp -r $INPUT_DIR/final* $OUTPUT_DIR/final
mv $OUTPUT_DIR/final/final_cpp/final.dat $OUTPUT_DIR/final/final.verifier.dat

mkdir -p $OUTPUT_DIR/recursive1
cp -r $INPUT_DIR/recursive1* $OUTPUT_DIR/recursive1
mv $OUTPUT_DIR/recursive1/recursive1_cpp/recursive1.dat $OUTPUT_DIR/recursive1/recursive1.verifier.dat
cp $INPUT_DIR/recursive.starkstruct.json $OUTPUT_DIR/recursive1/recursive1.starkstruct.json

mkdir -p $OUTPUT_DIR/recursive2
cp -r $INPUT_DIR/recursive2* $OUTPUT_DIR/recursive2
mv $OUTPUT_DIR/recursive2/recursive2_cpp/recursive2.dat $OUTPUT_DIR/recursive2/recursive2.verifier.dat
cp $INPUT_DIR/recursive.starkstruct.json $OUTPUT_DIR/recursive2/recursive2.starkstruct.json

mkdir -p $OUTPUT_DIR/recursivef
cp -r $INPUT_DIR/recursivef* $OUTPUT_DIR/recursivef
mv $OUTPUT_DIR/recursivef/recursivef_cpp/recursivef.dat $OUTPUT_DIR/recursivef/recursivef.verifier.dat

mkdir -p $OUTPUT_DIR/scripts
cp -r $INPUT_DIR/rom.json $INPUT_DIR/metadata-rom.txt $INPUT_DIR/storage_sm_rom.json $OUTPUT_DIR/scripts

mkdir -p $OUTPUT_DIR/zkevm
cp -r $INPUT_DIR/zkevm* $OUTPUT_DIR/zkevm
mv $OUTPUT_DIR/zkevm/zkevm.verifier_cpp/zkevm.verifier.dat $OUTPUT_DIR/zkevm/zkevm.verifier.dat
