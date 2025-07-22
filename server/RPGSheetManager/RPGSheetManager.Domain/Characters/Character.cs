namespace RPGSheetManager.Domain.Characters {
    public class Character {
        public Guid Id { get; set; }
        public Guid SystemId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Name { get; set; }
        public List<CharacterData> Data { get; set; }
    }

    public class CharacterData {
        public string Name { get; set; }
        public string Component { get; set; }
        public string Value { get; set; }
        public bool Editable { get; set; }
        public bool SessionEditable { get; set; }
        public bool Visible { get; set; }
        public string Category { get; set; }
    }
}
