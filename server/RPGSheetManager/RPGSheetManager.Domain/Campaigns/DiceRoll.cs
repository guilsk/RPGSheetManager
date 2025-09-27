using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class DiceRoll {
        [BsonElement("rollerId")]
        public required string RollerId { get; set; }
        [BsonElement("expression")]
        public required string Expression { get; set; } // ex: "2d6+3"
        [BsonElement("result")]
        public int Result { get; set; }
        [BsonElement("individualRolls")]
        public List<int>? IndividualRolls { get; set; } // ex: [4, 5]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
