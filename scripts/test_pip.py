import os, earthaccess
from dotenv import load_dotenv
load_dotenv()
auth = earthaccess.login(strategy="environment")
print(auth.authenticated)