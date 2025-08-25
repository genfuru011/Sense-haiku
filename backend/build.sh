#!/usr/bin/env bash
# exit on error
set -o errexit

# MeCabのインストール（fugashi用）
apt-get update
apt-get install -y mecab mecab-ipadic-utf8 libmecab-dev

python -m pip install --upgrade pip
pip install -r requirements.txt
