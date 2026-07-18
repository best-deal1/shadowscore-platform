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
            self.data = {
                "groups": [],
                "posted_posts": [],
                "leads": []
            }
            self.save_data()

    def save_data(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    def add_group(self, name, link):
        self.data["groups"].append({"name": name, "link": link, "last_post": None})
        self.save_data()
        print(f"✅ נוספה קבוצה: {name}")

    def generate_post(self, style="value"):
        if style == "value":
            return """The marketplace already decided you're risky.
Most sellers find out way too late.

ShadowScore detects hidden signals like tracking drift, silent trust decay, and behavioral anomalies, weeks before restrictions or payout holds.

Comment "RISK" and I'll send you the link for an initial scan.

https://shadowscore.io/

#eBaySeller #AmazonFBA #Dropshipping #ShadowScore"""
        else:
            return """Most sellers think suspensions happen suddenly.

Reality? The marketplace flagged them long before.

ShadowScore gives you visibility into what they actually see.

Comment "RISK" """

    def log_post(self, group_name, post_text):
        self.data["posted_posts"].append({
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "group": group_name,
            "text": post_text[:100] + "..."
        })
        self.save_data()
        print(f"✅ פוסט נרשם בקבוצה: {group_name}")

    def show_stats(self):
        print("\n=== סטטיסטיקות שיווק פייסבוק ===")
        print(f"קבוצות: {len(self.data['groups'])}")
        print(f"פוסטים שפורסמו: {len(self.data['posted_posts'])}")
        print(f"לידים: {len(self.data['leads'])}")

    def run(self):
        print("🚀 Facebook Marketing Agent - ShadowScore")
        while True:
            print("\n1. הוסף קבוצה")
            print("2. צור פוסט חדש")
            print("3. רשום פוסט שפרסמת")
            print("4. סטטיסטיקות")
            print("5. יציאה")
            
            choice = input("\nבחר מספר: ")
            
            if choice == "1":
                name = input("שם הקבוצה: ")
                link = input("לינק לקבוצה: ")
                self.add_group(name, link)
            elif choice == "2":
                style = input("סגנון (value / direct): ") or "value"
                print("\n" + self.generate_post(style))
            elif choice == "3":
                group = input("שם הקבוצה: ")
                text = input("טקסט הפוסט (או Enter): ") or "פוסט רגיל"
                self.log_post(group, text)
            elif choice == "4":
                self.show_stats()
            elif choice == "5":
                break

if __name__ == "__main__":
    agent = FacebookMarketingAgent()
    agent.run()