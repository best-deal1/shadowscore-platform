import json
import os
from datetime import datetime

class FacebookMarketingAgent:
    def __init__(self):
        self.data_file = "fb_campaign.json"
        self.load_data()

    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        else:
            self.data = {"groups": [], "posted_posts": []}
            self.save_data()

    def save_data(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    def add_group(self):
        name = input("Group Name: ")
        link = input("Group Link: ")
        self.data["groups"].append({"name": name, "link": link})
        self.save_data()
        print(f"✅ Group added: {name}")

    def generate_post(self):
        print("\n" + "="*70)
        print("📋 Ready Facebook Post:")
        print("="*70)
        print("""The marketplace already decided you're risky.
Most sellers find out way too late.

ShadowScore detects hidden signals like tracking drift, silent trust decay, and behavioral anomalies.

Comment "RISK" and I'll send you the link for an initial scan.

https://shadowscore.io/

#eBaySeller #AmazonFBA #Dropshipping #ShadowScore""")
        print("="*70)

    def log_post(self):
        group = input("Group Name you posted in: ")
        self.data["posted_posts"].append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "group": group
        })
        self.save_data()
        print("✅ Post logged successfully!")

    def show_stats(self):
        print("\n=== Marketing Statistics ===")
        print(f"Total Groups: {len(self.data['groups'])}")
        print(f"Posts Published: {len(self.data['posted_posts'])}")

    def run(self):
        print("🚀 Facebook Marketing Agent - ShadowScore")
        while True:
            print("\n1. Add New Group")
            print("2. Create New Post")
            print("3. Log a Published Post")
            print("4. Show Statistics")
            print("5. Exit")
            choice = input("\nChoose number: ")
            
            if choice == "1":
                self.add_group()
            elif choice == "2":
                self.generate_post()
            elif choice == "3":
                self.log_post()
            elif choice == "4":
                self.show_stats()
            elif choice == "5":
                print("👋 Good luck with your marketing!")
                break

if __name__ == "__main__":
    agent = FacebookMarketingAgent()
    agent.run()