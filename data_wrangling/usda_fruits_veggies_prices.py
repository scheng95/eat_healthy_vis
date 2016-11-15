import os
from os import listdir
from os.path import isfile, join
import pandas as pd
import re
import json

from IPython import embed

curr_path = os.path.dirname(os.path.realpath(__file__))

mypath = os.path.abspath(join(curr_path, "..", "data_raw", "fruits_veggies"))

onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]

def condense_form_label(label):
	return {
		"Fresh": "fresh",
		"Packedinjuice": "canned_juice", 
		"Packedinsyrupsyrupdiscarded": "canned_nojuice", 
		"Dried": "dried"
	}.get(str(label))

# remove non-alphanumeric
pattern = re.compile('[\W_]+')

final_data = []
for file_name in onlyfiles:
	file_path = os.path.join(mypath, file_name)
	prod_name = file_name[:-5]
	print(file_name)

	df = pd.read_excel(file_path, header=1)
	# only the first 7 columns have useful data
	df = df[df.columns[:7]]
	# drop useless rows
	df.dropna(axis=0, how='any', inplace=True)

	empty_cols = [df.columns[2], df.columns[5]]
	df = df[[c for c in df.columns if c not in empty_cols]]
	df.columns = ["form", "price_pound", "yield", "cup_equiv", "price_cup"]

	df.loc[:, "form"] = df.form.apply(lambda x: ''.join([c for c in str(x) if not c.isdigit()]))
	df.loc[:, "form"] = df.form.apply(lambda x: condense_form_label(pattern.sub('', x)))

	final_data.append({
		"name": prod_name, 
		"data": df.to_dict(orient='records')
	})

# print to file
fout_name = "fruits_veggies.json"
out_path = os.path.abspath(join(curr_path, "..", "data", fout_name))
f_out = open(out_path, 'w')
f_out.write(json.dumps(final_data, indent=4, separators=(',', ': ')))
