import os
from os import listdir
from os.path import isfile, join
import pandas as pd
import re

from IPython import embed

curr_path = os.path.realpath(__file__)

embed()
mypath = join(curr_path, "../../..")

onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]

file_name="apricots.xlsx"
prod_name = file_name[-5:]
df = pd.read_excel(file_name, header=1)
df.dropna(axis=0, how='any', inplace=True)

empty_cols = [df.columns[2], df.columns[5]]
df = df[[c for c in df.columns if c not in empty_cols]]
df.columns = ["form", "price_pound", "yield", "cup_equiv", "price_cup"]

def condense_form_label(label):
	return {
		"Fresh": "fresh",
		"Packedinjuice": "canned_juice", 
		"Packedinsyrupsyrupdiscarded": "canned_nojuice", 
		"Dried": "dried"
	}.get(str(label))

# remove non-alphanumeric
pattern = re.compile('[\W_]+')

df.loc[:, "form"] = df.form.apply(lambda x: ''.join([c for c in str(x) if not c.isdigit()]))
df.loc[:, "form"] = df.form.apply(lambda x: condense_form_label(pattern.sub('', x)))

{
	"name": prod_name, 
	"data": df.to_dict(orient='records')
}