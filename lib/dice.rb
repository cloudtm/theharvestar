#This class takes care of simulating the roll of dices
class Dice
  class << self

    # Rolls one 6 faced dice (the number of faces can be passed).
    def roll(faces = 6)
      1 + rand(faces)
    end

    # Rolls two 6 faced dice (the number of faces can be passed).
    def double_roll(faces = 6)
      2 + rand(faces) + rand(faces)
    end
  end
end
