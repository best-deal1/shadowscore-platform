import json
import os
from datetime import datetime

class ShadowScoreAgent:
    def __init__(self):
        self.data_file = "campaign_data.json"
        self.load_data()

    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        else:
            self.data = {"posted_videos": [], "leads": []}
            self.save_data()

    def save_data(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    def generate_tiktok_script(self, topic="general"):
        topics = {
            "general": "The marketplace already decided you're risky. ShadowScore tells you first.",
            "trust_decay": "Your account doesn't die overnight. It dies slowly through trust decay.",
            "tba": "TBA tracking is silently killing more accounts than you think.",
            "guarantee": "30 days risk protection. If we miss it - you get your money back."
        }
        base = topics.get(topic, topics["general"])
        
        print("\n" + "="*60)
        print(f"🎥 TIKTOK SCRIPT - {topic.upper()}")
        print("="*60)
        print(f"Voiceover:\n{base}\n")
        print("CTA: Comment RISK or AUDIT")
        print("Hashtags: #eBaySeller #MC011 #AmazonFBA #Dropshipping #ShadowScore")
        print("="*60)

    def daily_recommendation(self):
        print("\n🚀 SHADOWSCORE MARKETING AGENT")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d')}")
        print("🎯 Today's Recommendation: Post about **Trust Decay**")
        self.generate_tiktok_script("trust_decay")

    def log_post(self):
        video = input("Video name / ID: ")
        topic = input("Topic (trust_decay / tba / guarantee): ")
        views = int(input("Views (0 if unknown): ") or 0)
        leads = int(input("Leads generated: ") or 0)
        
        self.data["posted_videos"].append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "video": video,
            "topic": topic,
            "views": views,
            "leads": leads
        })
        self.save_data()
        print("✅ Post logged successfully!")

    def show_stats(self):
        total = len(self.data["posted_videos"])
        leads = sum(v.get("leads", 0) for v in self.data["posted_videos"])
        print("\n" + "="*40)
        print("📊 CAMPAIGN STATISTICS")
        print("="*40)
        print(f"Total Videos Posted : {total}")
        print(f"Total Leads Generated: {leads}")
        print(f"TikTok Account      : @shadowscore8")
        print(f"Website             : shadowscore.io")
        print("="*40)

    def run(self):
        print("🚀 ShadowScore Marketing Agent - READY")
        while True:
            print("\n1. Daily Recommendation + Script")
            print("2. Create New Script")
            print("3. Log a Posted Video")
            print("4. Show Statistics")
            print("5. Exit")
            choice = input("\nEnter number: ")
            
            if choice == "1":
                self.daily_recommendation()
            elif choice == "2":
                t = input("Topic (general / trust_decay / tba / guarantee): ")
                self.generate_tiktok_script(t)
            elif choice == "3":
                self.log_post()
            elif choice == "4":
                self.show_stats()
            elif choice == "5":
                print("👋 Goodbye! Keep pushing ShadowScore.")
                break

if __name__ == "__main__":
    agent = ShadowScoreAgent()
    agent.run()